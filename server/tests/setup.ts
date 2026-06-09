import 'dotenv/config';
import 'reflect-metadata';
import { afterAll, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity.js';
import { Role } from '../src/entities/role.entity.js';
import { Permission } from '../src/entities/permission.entity.js';
import { Department } from '../src/entities/department.entity.js';

/**
 * 测试全局配置
 *
 * 使用独立测试数据库，每次运行前重建表结构。
 * 测试数据库名从环境变量 DB_NAME_TEST 读取，默认 admin_db_test。
 *
 * 前置条件：
 * CREATE DATABASE IF NOT EXISTS admin_db_test;
 */
let testDataSource: DataSource;

beforeAll(async () => {
  testDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME_TEST ?? 'admin_db_test',
    synchronize: true,
    dropSchema: true, // 每次运行前重建表结构，确保测试隔离
    entities: [User, Role, Permission, Department],
  });

  await testDataSource.initialize();
});

afterAll(async () => {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
});

/**
 * 获取全局测试 DataSource 实例
 * 在 beforeAll 执行后可用，所有测试共享同一连接
 */
export { testDataSource };
