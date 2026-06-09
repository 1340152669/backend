import type { RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { AuthService } from '../services/auth.service.js';
import { success } from '../utils/response.js';

/**
 * AuthController — 认证相关 HTTP 请求处理器
 *
 * @remarks
 * - 设计原理：登录、注册、个人信息、Token 刷新、密码修改的请求入口
 * - 职责：参数提取 → 委托 AuthService → 响应发送
 *
 * @example
 * const controller = new AuthController(dataSource);
 * router.post('/login', asyncHandler(controller.login));
 */
export class AuthController {
  private authService: AuthService;

  constructor(dataSource: DataSource) {
    this.authService = new AuthService(dataSource);
  }

  /** POST /api/v1/auth/login — 用户登录 */
  login: RequestHandler = async (req, res) => {
    const { username, password } = req.body;
    const result = await this.authService.login(username, password);
    success(res, result, '登录成功');
  };

  /** POST /api/v1/auth/register — 用户注册（公开接口） */
  register: RequestHandler = async (req, res) => {
    const result = await this.authService.register(req.body);
    success(res, result, '注册成功');
  };

  /** GET /api/v1/auth/me — 获取当前登录用户信息 */
  getProfile: RequestHandler = async (req, res) => {
    const user = await this.authService.getProfile(req.userId!);
    success(res, user);
  };

  /** POST /api/v1/auth/refresh — 刷新 Token */
  refreshToken: RequestHandler = async (req, res) => {
    const token = await this.authService.refreshToken(req.userId!);
    success(res, { token });
  };

  /** POST /api/v1/auth/change-password — 修改密码 */
  changePassword: RequestHandler = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    await this.authService.changePassword(req.userId!, oldPassword, newPassword);
    success(res, null, '密码修改成功');
  };
}
