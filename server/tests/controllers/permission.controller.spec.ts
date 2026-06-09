import { describe, it, expect, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { testDataSource } from '../setup.js';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/index.js';
import { createTestUser, createTestRole, createTestPermission } from '../factories/index.js';

describe('PermissionController', () => {
  let dataSource: DataSource;
  let app: Express.Application;
  let adminToken: string;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    dataSource = testDataSource;
    app = createApp(dataSource);

    const adminRole = await createTestRole(dataSource, { name: 'admin', isSystem: true });
    const adminUser = await createTestUser(dataSource, { username: `permadmin_${Date.now()}` });
    const userRepo = dataSource.getRepository('User') as any;
    adminUser.roles = [adminRole];
    await userRepo.save(adminUser);

    adminToken = jwt.sign(
      { userId: adminUser.id, username: adminUser.username },
      config.jwt.secret,
      { expiresIn: '1h' } as jwt.SignOptions,
    );

    request = supertest(app);
  });

  describe('GET /api/v1/permissions', () => {
    it('should return permission tree', async () => {
      const res = await request
        .get('/api/v1/permissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/permissions/dimensions', () => {
    it('should return dimension stats', async () => {
      const res = await request
        .get('/api/v1/permissions/dimensions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/permissions', () => {
    it('should create a permission', async () => {
      const suffix = Date.now();
      const res = await request
        .post('/api/v1/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `controller:perm_${suffix}`,
          label: `测试权限_${suffix}`,
          menuType: 'button',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.code).toBe(`controller:perm_${suffix}`);
    });
  });
});
