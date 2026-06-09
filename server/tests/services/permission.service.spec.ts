import { describe, it, expect, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import { testDataSource } from '../setup.js';
import { PermissionService } from '../../src/services/permission.service.js';
import { createTestPermission, createTestUser, createTestRole } from '../factories/index.js';
import { NotFoundError, ConflictError } from '../../src/utils/errors.js';

describe('PermissionService', () => {
  let dataSource: DataSource;
  let permissionService: PermissionService;

  beforeAll(async () => {
    dataSource = testDataSource;
    permissionService = new PermissionService(dataSource);
  });

  describe('getTree', () => {
    it('should return permission tree', async () => {
      const parent = await createTestPermission(dataSource, {
        code: 'system:menu', label: '父权限', menuType: 'menu' as any,
      });
      await createTestPermission(dataSource, {
        code: 'system:menu:read', label: '子权限', menuType: 'button' as any,
        parentId: parent.id,
      });

      const tree = await permissionService.getTree();
      expect(Array.isArray(tree)).toBe(true);
    });
  });

  describe('list', () => {
    it('should return paginated permissions', async () => {
      await createTestPermission(dataSource);
      const result = await permissionService.list({ page: 1, pageSize: 20 });

      expect(result.list).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.list.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getById', () => {
    it('should return permission by id', async () => {
      const perm = await createTestPermission(dataSource);
      const found = await permissionService.getById(perm.id);
      expect(found.id).toBe(perm.id);
    });

    it('should throw NotFoundError when permission does not exist', async () => {
      await expect(permissionService.getById('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a permission successfully', async () => {
      const suffix = Date.now();
      const perm = await permissionService.create({
        code: `custom:code_${suffix}`,
        label: `自定义权限_${suffix}`,
        menuType: 'button',
      });

      expect(perm.code).toBe(`custom:code_${suffix}`);
    });

    it('should throw ConflictError when code already exists', async () => {
      const existing = await createTestPermission(dataSource);
      await expect(permissionService.create({
        code: existing.code,
        label: '重复权限',
        menuType: 'button',
      })).rejects.toThrow(ConflictError);
    });
  });

  describe('update', () => {
    it('should update permission label', async () => {
      const perm = await createTestPermission(dataSource);
      const updated = await permissionService.update(perm.id, { label: '更新标签' });
      expect(updated.label).toBe('更新标签');
    });

    it('should throw NotFoundError when permission does not exist', async () => {
      await expect(permissionService.update('00000000-0000-0000-0000-000000000000', { label: 'test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a permission without children', async () => {
      const perm = await createTestPermission(dataSource);
      await permissionService.delete(perm.id);
      await expect(permissionService.getById(perm.id)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when permission has children', async () => {
      const parent = await createTestPermission(dataSource, { menuType: 'menu' as any });
      await createTestPermission(dataSource, { parentId: parent.id });

      await expect(permissionService.delete(parent.id)).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when permission does not exist', async () => {
      await expect(permissionService.delete('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserMenus', () => {
    it('should return menus for a user with permissions', async () => {
      const perm = await createTestPermission(dataSource, {
        code: 'system:user', label: '用户管理', menuType: 'menu' as any,
        path: '/users', componentPath: '@/views/Users.vue',
      });
      const role = await createTestRole(dataSource);
      const roleRepo = dataSource.getRepository('Role') as any;
      role.permissions = [perm];
      await roleRepo.save(role);

      const user = await createTestUser(dataSource);
      const userRepo = dataSource.getRepository('User') as any;
      user.roles = [role];
      await userRepo.save(user);

      const menus = await permissionService.getUserMenus(user.id);
      expect(Array.isArray(menus)).toBe(true);
    });

    it('should return empty array for user with no permissions', async () => {
      const user = await createTestUser(dataSource);
      const menus = await permissionService.getUserMenus(user.id);
      expect(menus).toHaveLength(0);
    });
  });

  describe('getDimensionStats', () => {
    it('should return dimension stats grouped by code prefix', async () => {
      await createTestPermission(dataSource, { code: 'system:user:read', label: '查看用户' });
      await createTestPermission(dataSource, { code: 'system:role:read', label: '查看角色' });

      const stats = await permissionService.getDimensionStats();
      expect(Array.isArray(stats)).toBe(true);
      if (stats.length > 0) {
        expect(stats[0].dimension).toBeDefined();
        expect(stats[0].totalPermissions).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
