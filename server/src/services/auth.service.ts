import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DataSource } from 'typeorm';
import { config } from '../config/index.js';
import { Role } from '../entities/role.entity.js';
import { User, UserStatus } from '../entities/user.entity.js';
import { RoleRepository } from '../repositories/role.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ConflictError, InvalidCredentialsError, UnauthorizedError } from '../utils/errors.js';
import { PermissionService } from './permission.service.js';
import type { CreateUserInput } from '../validators/user.validator.js';

/**
 * AuthService — 认证与授权业务逻辑
 *
 * @remarks
 * - 设计原理：封装登录、注册、Token 签发、密码修改等认证相关操作
 * - 依赖：UserRepository（用户数据）、RoleRepository（角色数据）
 * - 生命周期：每个 AuthController 实例创建一个关联的 AuthService 实例
 *
 * @example
 * const authService = new AuthService(dataSource);
 * const { token, user } = await authService.login('admin', 'admin123');
 */
export class AuthService {
  private userRepo: UserRepository;
  private roleRepo: RoleRepository;

  constructor(private readonly dataSource: DataSource) {
    this.userRepo = new UserRepository(dataSource.getRepository(User));
    this.roleRepo = new RoleRepository(dataSource.getRepository(Role));
  }

  /**
   * 用户登录
   *
   * @param username - 用户名
   * @param password - 明文密码
   * @returns { token, user } - JWT Token 和脱敏后的用户信息
   * @throws InvalidCredentialsError - 用户名/密码错误
   * @throws UnauthorizedError - 账号被禁用
   */
  async login(username: string, password: string) {
    const user = await this.userRepo.findByUsernameWithPassword(username);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedError('账户已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const token = this.generateToken(user.id, user.username);
    return { token, user: this.sanitizeUser(user) };
  }

  /**
   * 用户注册
   *
   * @param data - 注册信息（用户名、邮箱、密码、可选昵称）
   * @returns { token, user } - 注册成功后直接签发 Token
   * @throws ConflictError - 用户名或邮箱已存在
   */
  async register(data: CreateUserInput) {
    // 检查用户名唯一性
    const existingUser = await this.userRepo.findByUsername(data.username);
    if (existingUser) {
      throw new ConflictError('用户名已存在');
    }

    // 检查邮箱唯一性
    const existingEmail = await this.userRepo.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('邮箱已被使用');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 分配默认角色（user 角色）
    const defaultRole = await this.roleRepo.findByName('user');
    const roles = defaultRole ? [defaultRole] : [];

    const user = await this.userRepo.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      nickname: data.nickname,
      roles,
    });

    // 注册成功后直接签发 Token
    const token = this.generateToken(user.id, user.username);
    return { token, user: this.sanitizeUser(user) };
  }

  /**
   * 获取当前登录用户的个人信息（含角色、权限和可访问的菜单树）
   *
   * @param userId - 当前用户 ID
   * @returns 脱敏后的用户信息 + menus 字段（菜单树）
   */
  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId, {
      relations: { roles: { permissions: true } },
    });
    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }
    const profile = this.sanitizeUser(user);
    // 附加当前用户可访问的菜单权限树（directory + menu 类型）
    const permissionService = new PermissionService(this.dataSource);
    profile.menus = await permissionService.getUserMenus(userId);
    return profile;
  }

  /**
   * 刷新 Token
   *
   * @param userId - 用户 ID
   * @returns 新的 JWT Token
   */
  async refreshToken(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }
    return this.generateToken(user.id, user.username);
  }

  /**
   * 修改密码
   *
   * @param userId - 用户 ID
   * @param oldPassword - 原密码（需校验正确性）
   * @param newPassword - 新密码
   * @throws InvalidCredentialsError - 原密码不正确
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findByIdWithPassword(userId);
    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new InvalidCredentialsError('原密码不正确');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(userId, { password: hashedPassword } as any);
  }

  /* ──── 私有方法 ──── */

  /** 生成 JWT Token，payload 包含 userId 和 username */
  private generateToken(userId: string, username: string): string {
    const secret: string = config.jwt.secret;
    const expiresIn: string = config.jwt.expiresIn;
    return jwt.sign({ userId, username }, secret, { expiresIn } as jwt.SignOptions);
  }

  /** 脱敏用户信息（移除 password 字段），避免密码泄露 */
  private sanitizeUser(user: User) {
    const { password, ...rest } = user as any;
    return rest;
  }
}
