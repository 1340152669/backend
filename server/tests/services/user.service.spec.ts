import { describe, it, expect, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import { testDataSource } from '../setup.js';
import { UserService } from '../../src/services/user.service.js';
import { User } from '../../src/entities/user.entity.js';
import { createTestUser, createTestRole, createTestDepartment } from '../factories/index.js';
import { NotFoundError, ConflictError } from '../../src/utils/errors.js';
import bcrypt from 'bcryptjs';

describe('UserService', () => {
  let dataSource: DataSource;
  let userService: UserService;
  let userRepo: any;

  beforeAll(async () => {
    dataSource = testDataSource;
    userService = new UserService(dataSource);
    userRepo = dataSource.getRepository(User);
  });

  describe('list', () => {
    it('should return paginated users with default params', async () => {
      await createTestUser(dataSource);

      const result = await userService.list({ page: 1, pageSize: 20 });

      expect(result.list).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.pageSize).toBe(20);
      expect(result.list.length).toBeGreaterThanOrEqual(1);
    });

    it('should cap pageSize at 100', async () => {
      const result = await userService.list({ page: 1, pageSize: 999 });
      expect(result.meta.pageSize).toBe(100);
    });

    it('should return empty list when no users match', async () => {
      const result = await userService.list({ keyword: 'zzz_nonexistent_keyword_zzz' });
      expect(result.list).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return user with roles and departments', async () => {
      const user = await createTestUser(dataSource);
      const found = await userService.getById(user.id);

      expect(found.id).toBe(user.id);
      expect(found.username).toBe(user.username);
      expect(found.roles).toBeDefined();
      expect(found.departments).toBeDefined();
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(userService.getById('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const suffix = Date.now();
      const user = await userService.create({
        username: `create_test_${suffix}`,
        email: `create_${suffix}@example.com`,
        password: 'password123',
        nickname: '创建的测试用户',
      });

      expect(user.username).toBe(`create_test_${suffix}`);
      expect(user.nickname).toBe('创建的测试用户');
      expect((user as any).password).toBeUndefined();
    });

    it('should create user with roleIds', async () => {
      const role = await createTestRole(dataSource);
      const suffix = Date.now();
      const user = await userService.create({
        username: `create_role_${suffix}`,
        email: `role_${suffix}@example.com`,
        password: 'password123',
        roleIds: [role.id],
      });

      expect(user.roles).toBeDefined();
      expect(user.roles.length).toBeGreaterThanOrEqual(1);
    });

    it('should throw ConflictError when username already exists', async () => {
      const existing = await createTestUser(dataSource);
      await expect(userService.create({
        username: existing.username,
        email: `diff_${Date.now()}@example.com`,
        password: 'password123',
      })).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when email already exists', async () => {
      const existing = await createTestUser(dataSource);
      await expect(userService.create({
        username: `diff_${Date.now()}`,
        email: existing.email,
        password: 'password123',
      })).rejects.toThrow(ConflictError);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = await createTestUser(dataSource);
      const updated = await userService.update(user.id, {
        nickname: '更新后的昵称',
      });

      expect(updated.nickname).toBe('更新后的昵称');
    });

    it('should throw ConflictError when email is taken by another user', async () => {
      const user1 = await createTestUser(dataSource);
      const user2 = await createTestUser(dataSource);

      await expect(userService.update(user2.id, { email: user1.email }))
        .rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(userService.update('00000000-0000-0000-0000-000000000000', { nickname: 'test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should soft-delete a user', async () => {
      const user = await createTestUser(dataSource);
      await userService.delete(user.id);

      await expect(userService.getById(user.id))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(userService.delete('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('toggleStatus', () => {
    it('should enable/disable user', async () => {
      const user = await createTestUser(dataSource, { status: 0 as any });
      const enabled = await userService.toggleStatus(user.id, 1 as any);
      expect(enabled.status).toBe(1);

      const disabled = await userService.toggleStatus(user.id, 0 as any);
      expect(disabled.status).toBe(0);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(userService.toggleStatus('00000000-0000-0000-0000-000000000000', 1 as any))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to user', async () => {
      const user = await createTestUser(dataSource);
      const role = await createTestRole(dataSource);

      const updated = await userService.assignRoles(user.id, [role.id]);

      expect(updated.roles.some((r: any) => r.id === role.id)).toBe(true);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(userService.assignRoles('00000000-0000-0000-0000-000000000000', []))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const user = await createTestUser(dataSource);
      await userService.resetPassword(user.id, 'newPassword123');

      // 验证可以直接用新密码登录
      const updatedUser = await userRepo.findOne({
        where: { id: user.id },
        select: { id: true, password: true },
      } as any);
      const isMatch = await bcrypt.compare('newPassword123', updatedUser!.password);
      expect(isMatch).toBe(true);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(userService.resetPassword('00000000-0000-0000-0000-000000000000', 'pass'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
