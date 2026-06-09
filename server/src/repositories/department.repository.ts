import { FindOptionsWhere, Repository } from 'typeorm';
import { Department } from '../entities/department.entity.js';
import { BaseRepository } from './base.repository.js';

/**
 * 部门仓库 — 部门实体的数据访问层
 *
 * @remarks
 * - 设计原理：封装 Department 实体的独特查询方法
 * - 提供树结构查询：全部加载后由 Service 组装树
 */
export class DepartmentRepository extends BaseRepository<Department> {
    constructor(repo: Repository<Department>) {
        super(repo);
    }

    /** 查询所有部门（含父级关联，用于前端组装树） */
    async findAllWithParent(): Promise<Department[]> {
        return this.repo.find({
            relations: { parent: true },
            order: { sort: 'ASC', createdAt: 'DESC' },
        });
    }

    /** 查询所有部门（含子集和用户关联） */
    async findAllWithChildren(): Promise<Department[]> {
        return this.repo.find({
            relations: { children: true, users: true },
            order: { sort: 'ASC', createdAt: 'DESC' },
        });
    }

    /**
     * 按名称精确查询（部门名唯一性检查）
     *
     * @param name - 目标部门名
     * @param withDeleted - 是否包含软删除记录
     */
    async findByName(name: string, withDeleted = false): Promise<Department | null> {
        return this.findOneBy({ name } as FindOptionsWhere<Department>, withDeleted ? { withDeleted: true } : undefined);
    }

    /** 查询指定父级下的子部门数量 */
    async countByParentId(parentId: string | null): Promise<number> {
        return this.repo.count({
            where: { parentId: parentId ?? undefined } as FindOptionsWhere<Department>,
        });
    }
}
