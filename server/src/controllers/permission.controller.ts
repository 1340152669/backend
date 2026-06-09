/**
 * 权限管理控制器
 *
 * 职责：
 * - 处理权限 CRUD 的 HTTP 请求
 * - 参数提取、响应发送
 * - 委托 PermissionService 执行业务逻辑
 */

import type { RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { PermissionService } from '../services/permission.service.js';
import type { PaginationQuery } from '../types/index.js';
import { success, successWithPaginated } from '../utils/response.js';

export class PermissionController {
    private permissionService: PermissionService;

    constructor(dataSource: DataSource) {
        this.permissionService = new PermissionService(dataSource);
    }

    /** GET /api/v1/permissions — 权限树（按父子结构组织，支持排序） */
    getTree: RequestHandler = async (req, res) => {
        const sortBy = req.query.sortBy as string | undefined;
        const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'ASC';
        const tree = await this.permissionService.getTree(sortBy, sortOrder);
        success(res, tree);
    };

    /** GET /api/v1/permissions/list — 权限分页列表（支持排序） */
    list: RequestHandler = async (req, res) => {
        const params: PaginationQuery = {
            page: parseInt(req.query.page as string) || 1,
            pageSize: parseInt(req.query.pageSize as string) || 20,
            sortBy: req.query.sortBy as string | undefined,
            sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'ASC',
        };
        const result = await this.permissionService.list(params);
        successWithPaginated(res, result);
    };

    /** GET /api/v1/permissions/:id — 权限详情 */
    getById: RequestHandler = async (req, res) => {
        const permission = await this.permissionService.getById(req.params.id as string);
        success(res, permission);
    };

    /** POST /api/v1/permissions — 创建权限 */
    create: RequestHandler = async (req, res) => {
        const permission = await this.permissionService.create(req.body);
        success(res, permission, '权限创建成功');
    };

    /** PUT /api/v1/permissions/:id — 更新权限 */
    update: RequestHandler = async (req, res) => {
        const permission = await this.permissionService.update(req.params.id as string, req.body);
        success(res, permission, '权限更新成功');
    };

    /** DELETE /api/v1/permissions/:id — 删除权限 */
    delete: RequestHandler = async (req, res) => {
        await this.permissionService.delete(req.params.id as string);
        success(res, null, '权限删除成功');
    };

    /** GET /api/v1/permissions/dimensions — 权限维度统计（按 module 分组 + 角色绑定数） */
    dimensions: RequestHandler = async (_req, res) => {
        const stats = await this.permissionService.getDimensionStats();
        success(res, stats);
    };

}
