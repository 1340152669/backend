import type { RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { DepartmentService } from '../services/department.service.js';
import { success } from '../utils/response.js';

/**
 * DepartmentController — 部门管理 HTTP 请求处理器
 *
 * @remarks
 * - 设计原理：部门 CRUD、状态切换、用户分配的请求入口
 * - 职责：参数提取 → 委托 DepartmentService → 响应发送
 *
 * @example
 * const controller = new DepartmentController(dataSource);
 * router.get('/', requirePermission(Permissions.DeptRead), asyncHandler(controller.getTree));
 */
export class DepartmentController {
    private deptService: DepartmentService;

    constructor(dataSource: DataSource) {
        this.deptService = new DepartmentService(dataSource);
    }

    /** GET /api/v1/departments — 部门树 */
    getTree: RequestHandler = async (_req, res) => {
        const tree = await this.deptService.getTree();
        success(res, tree);
    };

    /** GET /api/v1/departments/:id — 部门详情 */
    getById: RequestHandler = async (req, res) => {
        const id = req.params.id as string;
        const dept = await this.deptService.getById(id);
        success(res, dept);
    };

    /** POST /api/v1/departments — 创建部门 */
    create: RequestHandler = async (req, res) => {
        const dept = await this.deptService.create(req.body);
        success(res, dept, '创建成功');
    };

    /** PUT /api/v1/departments/:id — 更新部门 */
    update: RequestHandler = async (req, res) => {
        const id = req.params.id as string;
        const dept = await this.deptService.update(id, req.body);
        success(res, dept, '更新成功');
    };

    /** DELETE /api/v1/departments/:id — 删除部门 */
    delete: RequestHandler = async (req, res) => {
        const id = req.params.id as string;
        await this.deptService.delete(id);
        success(res, null, '删除成功');
    };

    /** PATCH /api/v1/departments/:id/status — 启用/禁用部门 */
    toggleStatus: RequestHandler = async (req, res) => {
        const id = req.params.id as string;
        const dept = await this.deptService.toggleStatus(id, req.body.status);
        success(res, dept, '状态更新成功');
    };

    /** PUT /api/v1/departments/:id/users — 分配部门用户 */
    assignUsers: RequestHandler = async (req, res) => {
        const id = req.params.id as string;
        const dept = await this.deptService.assignUsers(id, req.body.userIds);
        success(res, dept, '用户分配成功');
    };
}
