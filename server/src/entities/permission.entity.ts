/**
 * 权限实体（Permission）
 *
 * 设计原则：
 * - 支持三级菜单类型：目录（directory）、菜单（menu）、按钮（button）
 * - parentId 自关联构建无限级权限树
 * - code 全局唯一，作为权限字符用于权限校验
 *
 * 类型字段差异：
 * - 目录：icon + 路由地址 + 显示/菜单状态
 * - 菜单：目录字段 + 组件路径 + 权限字符 + 路由参数 + 缓存控制
 * - 按钮：显示排序 + 菜单名称 + 权限字符 + 菜单状态
 */

import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Role } from './role.entity.js';

/** 菜单类型枚举 */
export type MenuType = 'directory' | 'menu' | 'button';

@Entity('permissions')
export class Permission extends BaseEntity {
    /** 权限字符（如 system:user:read），全局唯一 */
    @Column({ type: 'varchar', unique: true, length: 100 })
    code!: string;

    /** 菜单名称（页面展示用） */
    @Column({ type: 'varchar', length: 100 })
    label!: string;

    /** 权限描述（可选） */
    @Column({ type: 'text', nullable: true })
    description?: string;

    /** 菜单类型：directory-目录 | menu-菜单 | button-按钮 */
    @Column({ type: 'varchar', length: 20, default: 'menu' })
    menuType!: MenuType;

    /** 菜单图标（仅目录/菜单使用） */
    @Column({ type: 'varchar', length: 100, nullable: true })
    icon?: string;

    /** 显示排序（数值越小越靠前） */
    @Column({ type: 'int', default: 0 })
    sort!: number;

    /** 是否外链 */
    @Column({ type: 'boolean', default: false })
    isExternalLink!: boolean;

    /** 路由地址（前端路由 path） */
    @Column({ type: 'varchar', length: 200, nullable: true })
    path?: string;

    /** 路由名称（仅菜单使用） */
    @Column({ type: 'varchar', length: 100, nullable: true })
    routeName?: string;

    /** 组件路径（仅菜单使用） */
    @Column({ type: 'varchar', length: 200, nullable: true })
    componentPath?: string;

    /** 路由参数（JSON 字符串，仅菜单使用） */
    @Column({ type: 'text', nullable: true })
    routeParams?: string;

    /** 是否缓存页面（仅菜单使用，默认缓存） */
    @Column({ type: 'boolean', default: true })
    isCache!: boolean;

    /** 显示状态：true-显示 | false-隐藏 */
    @Column({ type: 'boolean', default: true })
    isShow!: boolean;

    /** 菜单状态：1-正常 | 0-停用 */
    @Column({ type: 'int', default: 1 })
    status!: number;

    /** 父权限 ID，构建权限树使用 */
    @Column({ type: 'varchar', nullable: true })
    parentId?: string;

    /** 父权限实体，自关联多对一 */
    @ManyToOne(() => Permission, (permission) => permission.children, { nullable: true })
    parent?: Permission;

    /** 子权限列表，自关联一对多 */
    @OneToMany(() => Permission, (permission) => permission.parent)
    children?: Permission[];

    /** 拥有此权限的角色列表，多对多反向映射 */
    @ManyToMany(() => Role, (role) => role.permissions)
    roles!: Role[];
}
