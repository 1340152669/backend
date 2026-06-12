import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config/index.js';
import { Department } from './entities/department.entity.js';
import { Permission } from './entities/permission.entity.js';
import { Role } from './entities/role.entity.js';
import { User } from './entities/user.entity.js';
import { createApp } from './app.js';

/**
 * 应用启动入口
 *
 * 启动流程：
 * 1. 创建 TypeORM DataSource 并连接数据库
 * 2. 自动同步表结构（开发环境）
 * 3. 创建 Express 应用实例
 * 4. 启动 HTTP 服务
 */

const dataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: config.nodeEnv === 'development',
  logging: config.nodeEnv === 'development',
  entities: [User, Role, Permission, Department],
});

async function bootstrap() {
  try {
    await dataSource.initialize();
    console.log('[DB] 数据库连接成功');

    const app = createApp(dataSource);
    app.listen(config.port, () => {
      console.log(`[Server] 服务已启动 → http://localhost:${config.port}`);
      console.log(`[Server] API 基础路径 → /api/v1`);
      console.log(`[Server] 健康检查 → http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('[FATAL] 启动失败:', err);
    process.exit(1);
  }
}

bootstrap();
