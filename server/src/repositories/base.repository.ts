import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity.js';

/**
 * 基础仓库抽象类 — 消除 CRUD 样板代码
 *
 * @remarks
 * - 设计原理：所有实体仓库继承此类，自动获得标准 CRUD 方法
 * - 子类只需扩展该实体特有的查询方法
 *
 * @example
 * class UserRepo extends BaseRepository<User> {
 *   constructor(repo: Repository<User>) { super(repo); }
 * }
 */
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected readonly repo: Repository<T>) {}

  /** 按 ID 查询单条记录 */
  async findById(id: string, options?: FindOneOptions<T>): Promise<T | null> {
    return this.repo.findOne({
      where: { id } as FindOptionsWhere<T>,
      ...options,
    });
  }

  /** 查询所有记录（支持过滤、排序、关联） */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repo.find(options);
  }

  /** 分页查询，返回 [数据列表, 总数] */
  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    return this.repo.findAndCount(options);
  }

  /** 按条件查询单条记录 */
  async findOneBy(
    where: FindOptionsWhere<T>,
    options?: FindOneOptions<T>,
  ): Promise<T | null> {
    return this.repo.findOne({ where, ...options });
  }

  /** 创建并保存单条记录 */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  /** 批量创建并保存多条记录 */
  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repo.create(data);
    return this.repo.save(entities);
  }

  /** 更新指定记录，返回更新后的完整实体 */
  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  /** 软删除（设置 deletedAt 时间戳） */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  /** 硬删除（从数据库彻底移除，慎用） */
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /** 统计符合条件的记录数量 */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repo.count({ where });
  }

  /** 判断符合条件的记录是否存在 */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repo.count({ where });
    return count > 0;
  }

  /** 保存实体变更（更新关联关系后使用） */
  async save(entity: T): Promise<T> {
    return this.repo.save(entity);
  }

  /** 获取原始 TypeORM Repository（供复杂查询使用） */
  getRawRepository(): Repository<T> {
    return this.repo;
  }
}
