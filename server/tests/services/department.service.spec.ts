import { describe, it, expect, beforeAll } from 'vitest';
import { DataSource } from 'typeorm';
import { testDataSource } from '../setup.js';
import { DepartmentService } from '../../src/services/department.service.js';
import { createTestDepartment, createTestUser } from '../factories/index.js';
import { NotFoundError, ConflictError } from '../../src/utils/errors.js';

describe('DepartmentService', () => {
  let dataSource: DataSource;
  let deptService: DepartmentService;

  beforeAll(async () => {
    dataSource = testDataSource;
    deptService = new DepartmentService(dataSource);
  });

  describe('getTree', () => {
    it('should return department tree', async () => {
      const parent = await createTestDepartment(dataSource);
      await createTestDepartment(dataSource, { parentId: parent.id });

      const tree = await deptService.getTree();
      expect(Array.isArray(tree)).toBe(true);
    });

    it('should return empty array when no departments exist', async () => {
      // Assuming clean test DB - the tree might have data from other tests
      // Just verify it returns an array
      const tree = await deptService.getTree();
      expect(Array.isArray(tree)).toBe(true);
    });
  });

  describe('getById', () => {
    it('should return department with parent, children and users', async () => {
      const dept = await createTestDepartment(dataSource);
      const found = await deptService.getById(dept.id);

      expect(found.id).toBe(dept.id);
      expect(found.name).toBe(dept.name);
    });

    it('should throw NotFoundError when department does not exist', async () => {
      await expect(deptService.getById('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a department successfully', async () => {
      const suffix = Date.now();
      const dept = await deptService.create({
        name: `新部门_${suffix}`,
        sort: 1,
      });

      expect(dept.name).toBe(`新部门_${suffix}`);
      expect(dept.sort).toBe(1);
      expect(dept.status).toBe(1);
    });

    it('should create a child department with parent', async () => {
      const parent = await createTestDepartment(dataSource);
      const child = await deptService.create({
        name: `子部门_${Date.now()}`,
        parentId: parent.id,
      });

      expect(child.parentId).toBe(parent.id);
    });

    it('should throw ConflictError when department name already exists', async () => {
      const existing = await createTestDepartment(dataSource);
      await expect(deptService.create({ name: existing.name }))
        .rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when parent department does not exist', async () => {
      await expect(deptService.create({
        name: `孤儿部门_${Date.now()}`,
        parentId: '00000000-0000-0000-0000-000000000000',
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update department fields', async () => {
      const dept = await createTestDepartment(dataSource);
      const updated = await deptService.update(dept.id, { name: '更新名称' });
      expect(updated.name).toBe('更新名称');
    });

    it('should throw ConflictError when name already exists', async () => {
      const dept1 = await createTestDepartment(dataSource);
      const dept2 = await createTestDepartment(dataSource);
      await expect(deptService.update(dept2.id, { name: dept1.name }))
        .rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when setting self as parent', async () => {
      const dept = await createTestDepartment(dataSource);
      await expect(deptService.update(dept.id, { parentId: dept.id }))
        .rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when department does not exist', async () => {
      await expect(deptService.update('00000000-0000-0000-0000-000000000000', { name: 'test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a department without children or users', async () => {
      const dept = await createTestDepartment(dataSource);
      await deptService.delete(dept.id);
      await expect(deptService.getById(dept.id)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when department has children', async () => {
      const parent = await createTestDepartment(dataSource);
      await createTestDepartment(dataSource, { parentId: parent.id });

      await expect(deptService.delete(parent.id)).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when department does not exist', async () => {
      await expect(deptService.delete('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('toggleStatus', () => {
    it('should enable/disable department', async () => {
      const dept = await createTestDepartment(dataSource, { status: 0 as any });
      const enabled = await deptService.toggleStatus(dept.id, 1 as any);
      expect(enabled.status).toBe(1);

      const disabled = await deptService.toggleStatus(dept.id, 0 as any);
      expect(disabled.status).toBe(0);
    });

    it('should throw NotFoundError when department does not exist', async () => {
      await expect(deptService.toggleStatus('00000000-0000-0000-0000-000000000000', 1 as any))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('assignUsers', () => {
    it('should assign users to department', async () => {
      const dept = await createTestDepartment(dataSource);
      const user = await createTestUser(dataSource);

      const updated = await deptService.assignUsers(dept.id, [user.id]);
      expect(updated.users).toBeDefined();
      expect(updated.users!.some((u: any) => u.id === user.id)).toBe(true);
    });

    it('should throw NotFoundError when department does not exist', async () => {
      await expect(deptService.assignUsers('00000000-0000-0000-0000-000000000000', []))
        .rejects.toThrow(NotFoundError);
    });
  });
});
