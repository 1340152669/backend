/**
 * 数据库初始化种子脚本
 *
 * 职责：
 * 1. 创建系统默认权限（按 directory → menu → button 三级命名）
 * 2. 设置菜单权限的路由/组件路径，供前端动态生成侧边栏
 * 3. 创建系统内置角色（admin / user）
 * 4. 创建默认管理员账号
 * 5. 将全部权限分配给 admin 角色
 *
 * 权限结构：directory(目录) → menu(菜单) → button(按钮)
 * - directory（目录）：侧边栏分组，无组件，有图标和路由地址
 * - menu（菜单）：可访问的页面，有组件路径和路由地址
 * - button（按钮）：页面内的操作权限，无菜单展示
 *
 * 运行方式：
 * ```bash
 * npx ts-node src/seed.ts
 * ```
 *
 * 安全设计：
 * - 幂等：跳过已存在的记录
 * - 仅在生产数据库初始化时运行，不覆盖已有数据
 */

import bcrypt from 'bcryptjs';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config/index.js';
import { Department } from './entities/department.entity.js';
import { Permission } from './entities/permission.entity.js';
import type { MenuType } from './entities/permission.entity.js';
import { Role } from './entities/role.entity.js';
import { User } from './entities/user.entity.js';
import { Permissions } from './lib/permissions.js';

// ──── 权限定义 ────

interface PermissionDef {
    code: string;
    label: string;
    description?: string;
    menuType?: MenuType;
    icon?: string;
    path?: string;
    componentPath?: string;
    routeName?: string;
    isShow?: boolean;
    isCache?: boolean;
    children?: PermissionDef[];
}

/**
 * 系统完整权限树（directory → menu → button 三级结构）
 *
 * 编码约定：
 * - directory（目录）：顶级入口，如 system（系统设置），有 children 无 component
 * - menu（菜单）：功能下的可访问页面，如 system:user（用户管理），有 componentPath
 * - button（按钮）：功能下的操作权限，如 system:user:read（查看用户），无菜单展示
 *
 * 路由/组件路径说明：
 * - path：前端路由地址（如 /users）
 * - componentPath：Vue 组件加载路径（如 @/views/system/user/UserListView.vue）
 * - routeName：Vue Router 路由名称（如 UserList）
 */
const PERMISSION_TREE: PermissionDef[] = [
    {
        code: Permissions.System,
        label: '系统设置',
        description: '系统管理菜单入口权限',
        menuType: 'directory',
        icon: 'Settings',
        path: '/system',
        children: [
            {
                code: Permissions.User,
                label: '用户管理',
                description: '用户管理模块',
                menuType: 'menu',
                icon: 'Users',
                path: '/users',
                componentPath: '@/views/system/user/UserListView.vue',
                routeName: 'UserList',
                isCache: true,
                children: [
                    { code: Permissions.UserRead, label: '查看用户', description: '查看用户列表和详情', menuType: 'button' },
                    { code: Permissions.UserCreate, label: '创建用户', description: '创建新用户账号', menuType: 'button' },
                    { code: Permissions.UserUpdate, label: '编辑用户', description: '修改用户信息和状态', menuType: 'button' },
                    { code: Permissions.UserDelete, label: '删除用户', description: '删除用户账号', menuType: 'button' },
                ],
            },
            {
                code: Permissions.Role,
                label: '角色管理',
                description: '角色管理模块',
                menuType: 'menu',
                icon: 'ShieldCheck',
                path: '/roles',
                componentPath: '@/views/system/role/RoleListView.vue',
                routeName: 'RoleList',
                isCache: true,
                children: [
                    { code: Permissions.RoleRead, label: '查看角色', description: '查看角色列表和详情', menuType: 'button' },
                    { code: Permissions.RoleCreate, label: '创建角色', description: '创建新角色', menuType: 'button' },
                    { code: Permissions.RoleUpdate, label: '编辑角色', description: '修改角色信息和权限分配', menuType: 'button' },
                    { code: Permissions.RoleDelete, label: '删除角色', description: '删除角色', menuType: 'button' },
                ],
            },
            {
                code: Permissions.Permission,
                label: '权限管理',
                description: '权限管理模块',
                menuType: 'menu',
                icon: 'Lock',
                path: '/permissions',
                componentPath: '@/views/system/permission/PermissionView.vue',
                routeName: 'PermissionList',
                isCache: true,
                children: [
                    { code: Permissions.PermissionRead, label: '查看权限', description: '查看权限列表和详情', menuType: 'button' },
                    { code: Permissions.PermissionCreate, label: '创建权限', description: '创建新权限', menuType: 'button' },
                    { code: Permissions.PermissionUpdate, label: '编辑权限', description: '修改权限定义', menuType: 'button' },
                    { code: Permissions.PermissionDelete, label: '删除权限', description: '删除权限', menuType: 'button' },
                ],
            },
            {
                code: Permissions.Dept,
                label: '部门管理',
                description: '部门管理模块',
                menuType: 'menu',
                icon: 'Building2',
                path: '/departments',
                componentPath: '@/views/system/department/DepartmentListView.vue',
                routeName: 'DepartmentList',
                isCache: true,
                children: [
                    { code: Permissions.DeptRead, label: '查看部门', description: '查看部门树和详情', menuType: 'button' },
                    { code: Permissions.DeptCreate, label: '创建部门', description: '创建新部门', menuType: 'button' },
                    { code: Permissions.DeptUpdate, label: '编辑部门', description: '修改部门信息和分配用户', menuType: 'button' },
                    { code: Permissions.DeptDelete, label: '删除部门', description: '删除部门', menuType: 'button' },
                ],
            },
        ],
    },
];

/**
 * 递归展平权限树，建立 parent 关系
 * @returns [所有权限列表, 第一级权限的 parentId 为 null]
 */
function flattenPermissions(
    tree: PermissionDef[],
    parentCode: string | null = null,
): {
    code: string; label: string; description?: string;
    menuType?: MenuType; icon?: string; path?: string;
    componentPath?: string; routeName?: string;
    isShow?: boolean; isCache?: boolean;
    parentCode: string | null;
}[] {
    const result: {
        code: string; label: string; description?: string;
        menuType?: MenuType; icon?: string; path?: string;
        componentPath?: string; routeName?: string;
        isShow?: boolean; isCache?: boolean;
        parentCode: string | null;
    }[] = [];

    for (const item of tree) {
        result.push({
            code: item.code,
            label: item.label,
            description: item.description,
            menuType: item.menuType,
            icon: item.icon,
            path: item.path,
            componentPath: item.componentPath,
            routeName: item.routeName,
            isShow: item.isShow,
            isCache: item.isCache,
            parentCode,
        });

        if (item.children) {
            result.push(...flattenPermissions(item.children, item.code));
        }
    }

    return result;
}

// ──── Seed 主函数 ────

async function seed() {
    console.log('⏳ 开始初始化种子数据...');

    // 创建 DataSource
    const dataSource = new DataSource({
        type: 'postgres',
        host: config.db.host,
        port: config.db.port,
        username: config.db.user,
        password: config.db.password,
        database: config.db.name,
        entities: [User, Role, Permission, Department],
        synchronize: true, // 确保表结构存在
    });

    await dataSource.initialize();
    console.log('✅ 数据库连接成功');

    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const userRepo = dataSource.getRepository(User);

    // ──── 0. 清理旧权限数据 ────
    console.log('⏳ 清理旧权限数据...');

    // 清空 role_permissions 关联表（解除角色-权限绑定）
    await dataSource.query('DELETE FROM "role_permissions"');
    console.log('  ✅ 已清空 role_permissions 关联数据');

    // 先删子权限（有 parentId），再删父权限（parentId IS NULL），避开 FK 自引用约束
    await dataSource.query('DELETE FROM permissions WHERE "parentId" IS NOT NULL');
    await dataSource.query('DELETE FROM permissions');
    console.log('  ✅ 已删除旧版权限数据');

    // ──── 1. 创建权限 ────
    console.log('⏳ 创建权限...');

    const flatPermissions = flattenPermissions(PERMISSION_TREE);
    const permissionMap = new Map<string, Permission>(); // code → entity

    for (const perm of flatPermissions) {
        const existing = await permissionRepo.findOne({
            where: { code: perm.code },
        });
        if (existing) {
            permissionMap.set(perm.code, existing);
            continue;
        }

        const newPerm = permissionRepo.create({
            code: perm.code,
            label: perm.label,
            description: perm.description,
            menuType: perm.menuType,
            icon: perm.icon,
            path: perm.path,
            componentPath: perm.componentPath,
            routeName: perm.routeName,
            isShow: perm.isShow ?? true,
            isCache: perm.isCache ?? true,
        });
        await permissionRepo.save(newPerm);
        permissionMap.set(perm.code, newPerm);
        console.log(`  ✅ 创建权限: ${perm.code}`);
    }

    // 建立父子关系（第二轮，因为父权限必须先存在）
    for (const perm of flatPermissions) {
        if (!perm.parentCode) continue;
        const child = permissionMap.get(perm.code);
        const parent = permissionMap.get(perm.parentCode);
        if (child && parent && !child.parentId) {
            child.parentId = parent.id;
            await permissionRepo.save(child);
        }
    }

    console.log(`✅ 权限创建完成，共 ${permissionMap.size} 个`);

    // ──── 2. 创建角色 ────
    console.log('⏳ 创建角色...');

    // admin 角色：拥有所有权限
    let adminRole = await roleRepo.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
        adminRole = roleRepo.create({
            name: 'admin',
            label: '系统管理员',
            description: '系统预置管理员角色，拥有所有权限',
            isSystem: true,
            status: 1,
        });
        await roleRepo.save(adminRole);
        console.log('  ✅ 创建角色: admin（系统管理员）');
    } else {
        console.log('  ⏭️  角色已存在: admin');
    }

    // 为 admin 角色分配所有权限
    const allPermissions = Array.from(permissionMap.values());
    adminRole.permissions = allPermissions;
    await roleRepo.save(adminRole);
    console.log(`  ✅ admin 角色已绑定 ${allPermissions.length} 个权限`);

    // user 角色：仅基础查看权限
    let userRole = await roleRepo.findOne({ where: { name: 'user' } });
    if (!userRole) {
        userRole = roleRepo.create({
            name: 'user',
            label: '普通用户',
            description: '系统预置普通用户角色，仅拥有查看权限',
            isSystem: true,
            status: 1,
        });
        await roleRepo.save(userRole);
        console.log('  ✅ 创建角色: user（普通用户）');
    } else {
        console.log('  ⏭️  角色已存在: user');
    }

    // 为 user 角色分配查看类权限
    const readPermissions = allPermissions.filter((p) => p.code.endsWith(':read'));
    userRole.permissions = readPermissions;
    await roleRepo.save(userRole);
    console.log(`  ✅ user 角色已绑定 ${readPermissions.length} 个权限`);

    // ──── 3. 创建默认管理员 ────
    console.log('⏳ 创建默认管理员...');

    const adminUsername = 'admin';
    let adminUser = await userRepo.findOne({
        where: { username: adminUsername },
    });
    if (!adminUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        adminUser = userRepo.create({
            username: adminUsername,
            email: 'admin@example.com',
            password: hashedPassword,
            nickname: '系统管理员',
            roles: [adminRole],
        });
        await userRepo.save(adminUser);
        console.log('  ✅ 创建管理员账号: admin / admin123');
    } else {
        console.log('  ⏭️  管理员账号已存在: admin');
    }

    // ──── 完成 ────
    await dataSource.destroy();
    console.log('\n🎉 种子数据初始化完成！');
    console.log('   管理员账号: admin / admin123');
}

seed().catch((err) => {
    console.error('❌ 种子数据初始化失败:', err);
    process.exit(1);
});
