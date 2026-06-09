import bcrypt from 'bcryptjs';
import type { DataSource } from 'typeorm';
import { User } from '../../src/entities/user.entity.js';
import { Role } from '../../src/entities/role.entity.js';
import { Permission } from '../../src/entities/permission.entity.js';
import type { MenuType } from '../../src/entities/permission.entity.js';
import { Department } from '../../src/entities/department.entity.js';

/**
 * 测试数据工厂
 *
 * 每个工厂函数：
 * - 使用时间戳后缀确保唯一性
 * - 接受 overrides 参数覆盖默认值
 * - 直接通过 Repository 持久化到测试数据库
 */

const getSuffix = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * 创建测试用户
 *
 * @param dataSource - TypeORM DataSource 实例
 * @param overrides - 部分 User 字段覆盖
 * @returns 已持久化的 User 实体
 *
 * @example
 * const user = await createTestUser(dataSource, { username: 'custom' })
 */
export async function createTestUser(
  dataSource: DataSource,
  overrides: Partial<User> = {},
): Promise<User> {
  const repo = dataSource.getRepository(User);
  const suffix = getSuffix();
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = repo.create({
    username: `testuser_${suffix}`,
    email: `test_${suffix}@example.com`,
    password: hashedPassword,
    nickname: '测试用户',
    status: 1,
    ...overrides,
  });

  return repo.save(user);
}

/**
 * 创建测试角色
 *
 * @param dataSource - TypeORM DataSource 实例
 * @param overrides - 部分 Role 字段覆盖
 * @returns 已持久化的 Role 实体
 *
 * @example
 * const role = await createTestRole(dataSource, { isSystem: true })
 */
export async function createTestRole(
  dataSource: DataSource,
  overrides: Partial<Role> = {},
): Promise<Role> {
  const repo = dataSource.getRepository(Role);
  const suffix = getSuffix();

  const role = repo.create({
    name: `test_role_${suffix}`,
    label: `测试角色_${suffix}`,
    description: '由测试工厂创建的测试角色',
    status: 1,
    isSystem: false,
    ...overrides,
  });

  return repo.save(role);
}

/**
 * 创建测试权限（支持树形结构）
 *
 * @param dataSource - TypeORM DataSource 实例
 * @param overrides - 部分 Permission 字段覆盖
 * @returns 已持久化的 Permission 实体
 *
 * @example
 * // 创建菜单级权限
 * const menu = await createTestPermission(dataSource, { menuType: 'menu' })
 * // 创建其子按钮权限
 * const btn = await createTestPermission(dataSource, { menuType: 'button', parentId: menu.id })
 */
export async function createTestPermission(
  dataSource: DataSource,
  overrides: Partial<Permission> & { parentId?: string | null } = {},
): Promise<Permission> {
  const repo = dataSource.getRepository(Permission);
  const suffix = getSuffix();
  const { parentId, ...rest } = overrides;

  const perm = repo.create({
    code: `test:code_${suffix}`,
    label: `测试权限_${suffix}`,
    menuType: 'button' as MenuType,
    isShow: true,
    isCache: true,
    sort: 0,
    status: 1,
    parentId: parentId ?? null,
    ...rest,
  });

  return repo.save(perm);
}

/**
 * 创建测试部门（支持树形结构）
 *
 * @param dataSource - TypeORM DataSource 实例
 * @param overrides - 部分 Department 字段覆盖
 * @returns 已持久化的 Department 实体
 *
 * @example
 * const dept = await createTestDepartment(dataSource)
 * const child = await createTestDepartment(dataSource, { parentId: dept.id })
 */
export async function createTestDepartment(
  dataSource: DataSource,
  overrides: Partial<Department> & { parentId?: string | null } = {},
): Promise<Department> {
  const repo = dataSource.getRepository(Department);
  const suffix = getSuffix();
  const { parentId, ...rest } = overrides;

  const dept = repo.create({
    name: `测试部门_${suffix}`,
    sort: 0,
    status: 1,
    parentId: parentId ?? null,
    ...rest,
  });

  return repo.save(dept);
}
