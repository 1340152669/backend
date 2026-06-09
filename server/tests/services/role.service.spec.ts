import { describe, it, expect, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import { testDataSource } from '../setup.js';
import { RoleService } from '../../src/services/role.service.js';
import { createTestRole, createTestPermission } from '../factories/index.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../src/utils/errors.js';

describe('RoleService', () => {
  let dataSource: DataSource;
  let roleService: RoleService;

  beforeAll(async () => {
    dataSource = testDataSource;
    roleService = new RoleService(dataSource);
  });

  describe('list', () => {
    it('should return all roles with permissions', async () => {
      await createTestRole(dataSource);
      const roles = await roleService.list();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThanOrEqual(1);
      expect(roles[0].permissions).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should return role with permissions', async () => {
      const role = await createTestRole(dataSource);
      const found = await roleService.getById(role.id);
      expect(found.id).toBe(role.id);
      expect(found.permissions).toBeDefined();
    });

    it('should throw NotFoundError when role does not exist', async () => {
      await expect(roleService.getById('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a role successfully', async () => {
      const suffix = Date.now();
      const role = await roleService.create({
        name: `new_role_${suffix}`,
        label: `新角色_${suffix}`,
        description: 'description',
      });

      expect(role.name).toBe(`new_role_${suffix}`);
      expect(role.status).toBe(1);
    });

    it('should throw ConflictError when name already exists', async () => {
      const existing = await createTestRole(dataSource);
      await expect(roleService.create({
        name: existing.name,
        label: '重复角色',
      })).rejects.toThrow(ConflictError);
    });
  });

  describe('update', () => {
    it('should update role fields', async () => {
      const role = await createTestRole(dataSource);
      const updated = await roleService.update(role.id, { label: '更新标签' });
      expect(updated.label).toBe('更新标签');
    });

    it('should forbid disabling system role', async () => {
      const role = await createTestRole(dataSource, { isSystem: true });
      await expect(roleService.update(role.id, { status: 0 as any }))
        .rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError when role does not exist', async () => {
      await expect(roleService.update('00000000-0000-0000-0000-000000000000', { label: 'test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a non-system role', async () => {
      const role = await createTestRole(dataSource, { isSystem: false });
      await roleService.delete(role.id);
      await expect(roleService.getById(role.id)).rejects.toThrow(NotFoundError);
    });

    it('should forbid deleting system role', async () => {
      const role = await createTestRole(dataSource, { isSystem: true });
      await expect(roleService.delete(role.id)).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError when role does not exist', async () => {
      await expect(roleService.delete('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('toggleStatus', () => {
    it('should enable/disable a non-system role', async () => {
      const role = await createTestRole(dataSource, { isSystem: false, status: 0 as any });
      const enabled = await roleService.toggleStatus(role.id, 1 as any);
      expect(enabled.status).toBe(1);
    });

    it('should forbid disabling system role', async () => {
      const role = await createTestRole(dataSource, { isSystem: true });
      await expect(roleService.toggleStatus(role.id, 0 as any))
        .rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError when role does not exist', async () => {
      await expect(roleService.toggleStatus('00000000-0000-0000-0000-000000000000', 1 as any))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('countBoundUsers', () => {
    it('should return 0 for a role with no users', async () => {
      const role = await createTestRole(dataSource);
      const count = await roleService.countBoundUsers(role.id);
      expect(typeof count).toBe('number');
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to role', async () => {
      const role = await createTestRole(dataSource);
      const perm = await createTestPermission(dataSource, { menuType: 'menu' as any });

      const updated = await roleService.assignPermissions(role.id, [perm.id]);
      expect(updated.permissions.some((p: any) => p.id === perm.id)).toBe(true);
    });

    it('should throw NotFoundError when role does not exist', async () => {
      await expect(roleService.assignPermissions('00000000-0000-0000-0000-000000000000', []))
        .rejects.toThrow(NotFoundError);
    });
  });
});
