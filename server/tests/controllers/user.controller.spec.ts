import { describe, it, expect, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { testDataSource } from '../setup.js';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/index.js';
import { createTestUser, createTestRole, createTestPermission } from '../factories/index.js';
import { authRequest } from '../helpers.js';

describe('UserController', () => {
  let dataSource: DataSource;
  let app: Express.Application;
  let adminToken: string;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    dataSource = testDataSource;
    app = createApp(dataSource);

    // 创建管理员用户（admin 角色具有所有权限）
    const adminRole = await createTestRole(dataSource, { name: 'admin', isSystem: true });
    const adminUser = await createTestUser(dataSource, {
      username: `admin_${Date.now()}`,
    });
    const userRepo = dataSource.getRepository('User') as any;
    adminUser.roles = [adminRole];
    await userRepo.save(adminUser);

    // 生成 JWT token
    adminToken = jwt.sign({ userId: adminUser.id, username: adminUser.username }, config.jwt.secret, {
      expiresIn: '1h',
    } as jwt.SignOptions);

    request = supertest(app);
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated user list', async () => {
      const res = await request
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const res = await request.get('/api/v1/users');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a user and return 200', async () => {
      const suffix = Date.now();
      const res = await request
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `ctrl_create_${suffix}`,
          email: `ctrl_${suffix}@example.com`,
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.username).toBe(`ctrl_create_${suffix}`);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user detail', async () => {
      const user = await createTestUser(dataSource);
      const res = await request
        .get(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(user.id);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should soft-delete a user', async () => {
      const user = await createTestUser(dataSource);
      const res = await request
        .delete(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });
});
