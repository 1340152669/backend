import { DataSource, In } from 'typeorm';
import { Department } from '../entities/department.entity.js';
import { User } from '../entities/user.entity.js';
import { DepartmentRepository } from '../repositories/department.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

/**
 * 部门树节点（带子部门列表）
 */
export interface DepartmentTreeNode extends Department {
    children: DepartmentTreeNode[];
}

/**
 * DepartmentService — 部门管理的业务逻辑
 *
 * @remarks
 * - 设计原理：封装部门 CRUD、树结构组装、用户关联等操作
 * - 删除部门时检查是否存在子部门或关联用户
 *
 * @example
 * const deptService = new DepartmentService(dataSource);
 * const tree = await deptService.getTree();
 */
export class DepartmentService {
    private deptRepo: DepartmentRepository;
    private userRepo: UserRepository;

    constructor(private readonly dataSource: DataSource) {
        this.deptRepo = new DepartmentRepository(
            dataSource.getRepository(Department),
        );
        this.userRepo = new UserRepository(dataSource.getRepository(User));
    }

    /**
     * 获取部门树（全部部门按父子关系组装为树结构）
     *
     * @returns 树状部门列表（根级部门，每级包含 children）
     */
    async getTree(): Promise<DepartmentTreeNode[]> {
        const all = await this.deptRepo.findAllWithParent();
        return this.buildTree(all);
    }

    /**
     * 将平铺部门列表组装为树结构
     *
     * @param departments - 平铺的部门列表（需含 parent 关联）
     * @returns 树状结构，根级部门按 sort 升序排列
     */
    private buildTree(departments: Department[]): DepartmentTreeNode[] {
        const map = new Map<string, DepartmentTreeNode>();
        const roots: DepartmentTreeNode[] = [];

        // 先转为可扩展的树节点
        for (const dept of departments) {
            map.set(dept.id, { ...dept, children: [] });
        }

        // 挂载子节点
        for (const dept of departments) {
            const node = map.get(dept.id)!;
            if (dept.parentId && map.has(dept.parentId)) {
                map.get(dept.parentId)!.children.push(node);
            } else if (!dept.parentId) {
                roots.push(node);
            }
        }

        // 同级按 sort 升序排列
        const sortChildren = (nodes: DepartmentTreeNode[]) => {
            nodes.sort((a, b) => a.sort - b.sort);
            for (const node of nodes) {
                if (node.children.length > 0) {
                    sortChildren(node.children);
                }
            }
        };
        sortChildren(roots);

        return roots;
    }

    /**
     * 部门详情（含父级、子级、用户关联）
     *
     * @param id - 部门 ID
     * @throws NotFoundError - 部门不存在
     */
    async getById(id: string): Promise<Department> {
        const dept = await this.deptRepo.findById(id, {
            relations: { parent: true, children: true, users: true },
        });
        if (!dept) {
            throw new NotFoundError('部门不存在');
        }
        return dept;
    }

    /**
     * 创建部门
     *
     * @param data - 部门信息（名称、排序、状态、父部门 ID）
     * @throws ConflictError - 部门名称重复
     * @throws NotFoundError - 父部门不存在
     */
    async create(data: {
        name: string;
        leader: string;
        contact: string;
        sort?: number;
        status?: 0 | 1;
        parentId?: string | null;
    }): Promise<Department> {
        // 检查名称唯一性（包含软删除记录）
        const existing = await this.deptRepo.findByName(data.name, true);
        if (existing) {
            throw new ConflictError('部门名称已存在');
        }

        // 检查父部门存在
        if (data.parentId) {
            const parent = await this.deptRepo.findById(data.parentId);
            if (!parent) {
                throw new NotFoundError('父部门不存在');
            }
        }

        try {
            return await this.deptRepo.create({
                name: data.name,
                leader: data.leader,
                contact: data.contact,
                sort: data.sort ?? 0,
                status: data.status ?? 1,
                parentId: data.parentId ?? undefined,
            });
        } catch (err: any) {
            if (err.code === '23505') {
                throw new ConflictError('部门名称已存在');
            }
            throw err;
        }
    }

    /**
     * 更新部门信息
     *
     * @param id - 部门 ID
     * @param data - 可更新字段（名称、排序、状态、父部门）
     * @throws NotFoundError - 部门不存在
     * @throws ConflictError - 部门名称重复
     */
    async update(
        id: string,
        data: {
            name?: string;
            leader?: string;
            contact?: string;
            sort?: number;
            status?: 0 | 1;
            parentId?: string | null;
        },
    ): Promise<Department> {
        const dept = await this.deptRepo.findById(id);
        if (!dept) {
            throw new NotFoundError('部门不存在');
        }

        if (data.name && data.name !== dept.name) {
            // 原因：包含软删除记录 + 排除自身，防止误判
            const existing = await this.deptRepo.findByName(data.name, true);
            if (existing && existing.id !== id) {
                throw new ConflictError('部门名称已存在');
            }
        }

        if (data.parentId !== undefined && data.parentId !== null) {
            const parent = await this.deptRepo.findById(data.parentId);
            if (!parent) {
                throw new NotFoundError('父部门不存在');
            }
            // 禁止将部门设为自身的子部门
            if (data.parentId === id) {
                throw new ConflictError('不能将部门设为自身的子部门');
            }
        }

        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.leader !== undefined) updateData.leader = data.leader;
        if (data.contact !== undefined) updateData.contact = data.contact;
        if (data.sort !== undefined) updateData.sort = data.sort;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.parentId !== undefined) updateData.parentId = data.parentId;
        // parentId 为 null 时设为根部门
        if (data.parentId === null) updateData.parentId = null;

        await this.deptRepo.update(id, updateData as any);
        return this.getById(id);
    }

    /**
     * 删除部门
     *
     * @throws NotFoundError - 部门不存在
     * @throws ConflictError - 存在子部门或关联用户
     */
    async delete(id: string): Promise<void> {
        const dept = await this.deptRepo.findById(id, {
            relations: { children: true, users: true },
        });
        if (!dept) {
            throw new NotFoundError('部门不存在');
        }

        if (dept.children && dept.children.length > 0) {
            throw new ConflictError('请先删除子部门');
        }

        if (dept.users && dept.users.length > 0) {
            throw new ConflictError('请先移除部门下的用户');
        }

        await this.deptRepo.softDelete(id);
    }

    /** 启用/禁用部门 */
    async toggleStatus(id: string, status: 0 | 1): Promise<Department> {
        const dept = await this.deptRepo.findById(id);
        if (!dept) {
            throw new NotFoundError('部门不存在');
        }
        await this.deptRepo.update(id, { status });
        return this.getById(id);
    }

    /**
     * 为部门分配用户（覆盖式）
     *
     * @param deptId - 部门 ID
     * @param userIds - 用户 ID 列表
     */
    async assignUsers(deptId: string, userIds: string[]): Promise<Department> {
        const dept = await this.deptRepo.findById(deptId, {
            relations: { users: true },
        });
        if (!dept) {
            throw new NotFoundError('部门不存在');
        }

        // 原因：去重防止 user_departments 唯一约束冲突
        const uniqueIds = [...new Set(userIds)];
        const users = await this.userRepo.getRawRepository().find({
            where: { id: In(uniqueIds) } as any,
        });
        dept.users = users;
        await this.deptRepo.save(dept);

        return this.getById(deptId);
    }
}
