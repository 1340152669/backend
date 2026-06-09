import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DataSource } from 'typeorm';
import { testDataSource } from '../setup.js';
import { AuthService } from '../../src/services/auth.service.js';
import { User } from '../../src/entities/user.entity.js';
import { Role } from '../../src/entities/role.entity.js';
import { createTestUser, createTestRole } from '../factories/index.js';
import {
  InvalidCredentialsError,
  UnauthorizedError,
  ConflictError,
} from '../../src/utils/errors.js';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let dataSource: DataSource;
  let authService: AuthService;
  let userRepo: any;
  let roleRepo: any;

  beforeAll(async () => {
    dataSource = testDataSource;
    authService = new AuthService(dataSource);
    userRepo = dataSource.getRepository(User);
    roleRepo = dataSource.getRepository(Role);
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const password = 'testpass123';
      const hashed = await bcrypt.hash(password, 10);
      const user = await createTestUser(dataSource, { password: hashed });

      const result = await authService.login(user.username, password);

      expect(result.token).toBeDefined();
      expect(result.user.username).toBe(user.username);
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw InvalidCredentialsError when user does not exist', async () => {
      await expect(authService.login('nonexistent_user', 'anypass'))
        .rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError when password is wrong', async () => {
      const user = await createTestUser(dataSource);
      await expect(authService.login(user.username, 'wrong_password'))
        .rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw UnauthorizedError when account is disabled', async () => {
      const user = await createTestUser(dataSource, { status: 0 as any });
      await expect(authService.login(user.username, 'password123'))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('register', () => {
    it('should register successfully and return token + user', async () => {
      const suffix = Date.now();
      const result = await authService.register({
        username: `newuser_${suffix}`,
        email: `new_${suffix}@example.com`,
        password: 'password123',
        nickname: '新用户',
      });

      expect(result.token).toBeDefined();
      expect(result.user.username).toBe(`newuser_${suffix}`);
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw ConflictError when username already exists', async () => {
      const existing = await createTestUser(dataSource);
      await expect(authService.register({
        username: existing.username,
        email: `diff_${Date.now()}@example.com`,
        password: 'password123',
      })).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when email already exists', async () => {
      const existing = await createTestUser(dataSource);
      await expect(authService.register({
        username: `diff_user_${Date.now()}`,
        email: existing.email,
        password: 'password123',
      })).rejects.toThrow(ConflictError);
    });
  });

  describe('getProfile', () => {
    it('should return user profile with menus', async () => {
      const user = await createTestUser(dataSource);
      const profile = await authService.getProfile(user.id);

      expect(profile.username).toBe(user.username);
      expect(profile.menus).toBeDefined();
      expect(Array.isArray(profile.menus)).toBe(true);
    });

    it('should throw UnauthorizedError when user does not exist', async () => {
      await expect(authService.getProfile('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refreshToken', () => {
    it('should generate a new JWT token for existing user', async () => {
      const user = await createTestUser(dataSource);
      const token = await authService.refreshToken(user.id);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT 格式: header.payload.signature
    });

    it('should throw UnauthorizedError when user does not exist', async () => {
      await expect(authService.refreshToken('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'oldpass123';
      const hashed = await bcrypt.hash(oldPassword, 10);
      const user = await createTestUser(dataSource, { password: hashed });

      await authService.changePassword(user.id, oldPassword, 'newpass456');
      // 验证新密码可用
      const updatedUser = await userRepo.findOne({
        where: { id: user.id },
        select: { id: true, password: true },
      } as any);
      const isMatch = await bcrypt.compare('newpass456', updatedUser!.password);
      expect(isMatch).toBe(true);
    });

    it('should throw InvalidCredentialsError when old password is wrong', async () => {
      const user = await createTestUser(dataSource);
      await expect(authService.changePassword(user.id, 'wrong_old', 'newpass456'))
        .rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw UnauthorizedError when user does not exist', async () => {
      await expect(
        authService.changePassword('00000000-0000-0000-0000-000000000000', 'old', 'new'),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
