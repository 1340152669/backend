import { describe, it, expect, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { testDataSource } from '../setup.js';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/index.js';
import { createTestUser, createTestRole, createTestDepartment } from '../factories/index.js';

describe('DepartmentController', () => {
  let dataSource: DataSource;
  let app: Express.Application;
  let adminToken: string;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    dataSource = testDataSource;
    app = createApp(dataSource);

    const adminRole = await createTestRole(dataSource, { name: 'admin', isSystem: true });
    const adminUser = await createTestUser(dataSource, { username: `deptadmin_${Date.now()}` });
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

  describe('GET /api/v1/departments', () => {
    it('should return department tree', async () => {
      const res = await request
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/departments', () => {
    it('should create a department', async () => {
      const suffix = Date.now();
      const res = await request
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `控制器测试部门_${suffix}` });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.name).toBe(`控制器测试部门_${suffix}`);
    });
  });

  describe('DELETE /api/v1/departments/:id', () => {
    it('should delete a department', async () => {
      const dept = await createTestDepartment(dataSource);
      const res = await request
        .delete(`/api/v1/departments/${dept.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
