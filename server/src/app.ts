import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import { errorHandler } from './middlewares/error.middleware.js';
import { createRoutes } from './routes/index.js';

/**
 * Express 应用工厂
 *
 * 职责：
 * 1. 注册全局中间件（JSON 解析、CORS 预留）
 * 2. 挂载所有路由（/api/v1）
 * 3. 注册兜底错误处理中间件
 *
 * 不包含：数据库连接、服务启动（由 index.ts 处理）
 */
export function createApp(dataSource: DataSource): express.Application {
  const app = express();

  // ──── 全局中间件 ────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS — 开发阶段放行所有来源，生产环境需配置白名单
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // ──── 健康检查 ────
  app.get('/api/health', (_req, res) => {
    res.json({ code: 0, message: 'success', data: { status: 'ok' } });
  });

  // ──── 业务路由 ────
  app.use('/api/v1', createRoutes(dataSource));

  // ──── 404 兜底 ────
  app.use((_req, res) => {
    res.status(404).json({ code: 1001, message: '接口不存在', data: null });
  });

  // ──── 全局错误处理（必须最后一个注册） ────
  app.use(errorHandler);

  return app;
}
