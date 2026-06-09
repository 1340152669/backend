import { describe, it, expect, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { testDataSource } from '../setup.js';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/index.js';
import { createTestUser, createTestRole } from '../factories/index.js';

describe('RoleController', () => {
  let dataSource: DataSource;
  let app: Express.Application;
  let adminToken: string;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    dataSource = testDataSource;
    app = createApp(dataSource);

    const adminRole = await createTestRole(dataSource, { name: 'admin', isSystem: true });
    const adminUser = await createTestUser(dataSource, { username: `roleadmin_${Date.now()}` });
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

  describe('GET /api/v1/roles', () => {
    it('should return role list', async () => {
      const res = await request
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/roles', () => {
    it('should create a role', async () => {
      const suffix = Date.now();
      const roleName = `ctrl_role_${suffix}`.replace(/\d/g, 'x');
      const res = await request
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: roleName,
          label: `测试_${suffix}`,
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.name).toBe(roleName);
    });
  });

  describe('DELETE /api/v1/roles/:id', () => {
    it('should return 403 when deleting system role', async () => {
      const systemRole = await createTestRole(dataSource, { isSystem: true });
      const res = await request
        .delete(`/api/v1/roles/${systemRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });
});
