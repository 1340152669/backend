/**
 * 权限校验 Schema
 *
 * 设计原则：
 * - code 遵循 menu:function:button 三级命名约定，常量定义在 lib/permissions.ts
 * - 创建时 code 必填，更新时所有字段可选
 * - 根据 menuType 动态校验不同字段集合：
 *   - directory：无需 componentPath / routeName / isCache
 *   - menu：需要 componentPath / routeName
 *   - button：无需 icon / path / routeName
 */

import { z } from 'zod';

/** 菜单类型枚举 */
const menuTypeEnum = z.enum(['directory', 'menu', 'button']);

/**
 * 创建权限校验
 *
 * @remarks
 * - code 为权限字符（如 system:user:read），目录类型可简化
 * - label 为菜单名称
 * - 不同 menuType 有不同的必填/选填字段组合
 */
export const createPermissionSchema = z.object({
    code: z
        .string()
        .min(2, '权限字符至少2个字符')
        .max(100, '权限字符最多100个字符'),
    label: z
        .string()
        .min(1, '菜单名称不能为空')
        .max(100, '菜单名称最多100个字符'),
    description: z.string().max(200).optional(),
    menuType: menuTypeEnum,
    icon: z.string().max(100).optional(),
    sort: z.number().int().min(0).max(9999).default(0).optional(),
    isExternalLink: z.boolean().default(false).optional(),
    path: z.string().max(200).optional(),
    routeName: z.string().max(100).optional(),
    componentPath: z.string().max(200).optional(),
    routeParams: z.string().max(500).optional(),
    isCache: z.boolean().default(true).optional(),
    isShow: z.boolean().default(true).optional(),
    status: z.number().int().min(0).max(1).default(1).optional(),
    parentId: z.string().uuid('上级菜单ID格式不正确').optional().nullable(),
});

/**
 * 更新权限校验
 *
 * @remarks
 * 所有字段可选，仅传递需要更新的字段。
 */
export const updatePermissionSchema = z.object({
    code: z
        .string()
        .min(2, '权限字符至少2个字符')
        .max(100)
        .optional(),
    label: z
        .string()
        .min(1, '菜单名称不能为空')
        .max(100)
        .optional(),
    description: z.string().max(200).optional(),
    menuType: menuTypeEnum.optional(),
    icon: z.string().max(100).optional().nullable(),
    sort: z.number().int().min(0).max(9999).optional(),
    isExternalLink: z.boolean().optional(),
    path: z.string().max(200).optional().nullable(),
    routeName: z.string().max(100).optional().nullable(),
    componentPath: z.string().max(200).optional().nullable(),
    routeParams: z.string().max(500).optional().nullable(),
    isCache: z.boolean().optional(),
    isShow: z.boolean().optional(),
    status: z.number().int().min(0).max(1).optional(),
    parentId: z.string().uuid('上级菜单ID格式不正确').optional().nullable(),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
