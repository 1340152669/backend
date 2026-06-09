import { describe, it, expect, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import supertest from 'supertest';
import { testDataSource } from '../setup.js';
import { createApp } from '../../src/app.js';
import { createTestUser } from '../factories/index.js';

describe('AuthController', () => {
  let dataSource: DataSource;
  let app: Express.Application;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    dataSource = testDataSource;
    app = createApp(dataSource);
    request = supertest(app);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 and token on successful login', async () => {
      const suffix = Date.now();
      // 直接通过 userService 创建用户（绕过密码哈希差异）
      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.hash('testpass123', 10);
      await createTestUser(dataSource, {
        username: `login_test_${suffix}`,
        password: hashed,
      });

      const res = await request
        .post('/api/v1/auth/login')
        .send({ username: `login_test_${suffix}`, password: 'testpass123' });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should return 401 with wrong password', async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .send({ username: 'nonexistent', password: 'wrongpass123' });

      expect(res.status).toBe(401);
    });

    it('should return 400 with invalid body', async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 200 and create user', async () => {
      const suffix = Date.now();
      const res = await request
        .post('/api/v1/auth/register')
        .send({
          username: `reg_test_${suffix}`,
          email: `reg_${suffix}@example.com`,
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 409 when username already exists', async () => {
      const existing = await createTestUser(dataSource);
      const res = await request
        .post('/api/v1/auth/register')
        .send({
          username: existing.username,
          email: `new_${Date.now()}@example.com`,
          password: 'password123',
        });

      expect(res.status).toBe(409);
    });
  });
});
