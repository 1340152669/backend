import 'dotenv/config';

/**
 * 应用全局配置
 *
 * 从环境变量读取所有配置项，提供安全的默认值。
 * 所有配置均为只读（as const），运行时不可修改。
 */
export const config = {
  // 当前运行环境：development / production / test
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // 服务监听端口，默认 3000
  port: parseInt(process.env.PORT ?? '3000', 10),

  // PostgreSQL 数据库连接配置
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'backend',
  },

  // JWT 令牌配置
  jwt: {
    // 签名密钥（生产环境必须通过环境变量设置）
    secret: process.env.JWT_SECRET ?? 'fallback-secret',
    // 访问令牌过期时间，默认 7 天
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    // 刷新令牌过期时间，默认 30 天
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },
} as const;
