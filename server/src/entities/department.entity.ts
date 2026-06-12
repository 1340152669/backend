import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { User } from './user.entity.js';

/**
 * 部门实体 — 树状结构组织管理
 *
 * @remarks
 * - 设计原理：自关联实现无限层级树，sort 字段控制同级排序
 * - 一对多自关联：parent → children 构建部门树
 * - 多对多关联 User：一个用户可属于多个部门（user_departments 中间表）
 *
 * @example
 * const dept = await departmentRepo.findOne({ where: { id }, relations: { children: true, users: true } });
 */
@Entity('departments')
export class Department extends BaseEntity {
    /** 部门名称 */
    @Column({ type: 'varchar', length: 100 })
    name!: string;

    /** 排序值（同级升序排列，值越小越靠前） */
    @Column({ type: 'int', default: 0 })
    sort!: number;

    /** 部门状态：1=启用 / 0=禁用 */
    @Column({ type: 'smallint', default: 1 })
    status!: 0 | 1;

    /** 父部门 ID（根部门为 null） */
    @Column({ type: 'varchar', nullable: true })
    parentId?: string;

    /** 父部门实体（自关联多对一） */
    @ManyToOne(() => Department, (dept) => dept.children, { nullable: true })
    parent?: Department;

    /** 子部门列表（自关联一对多） */
    @OneToMany(() => Department, (dept) => dept.parent)
    children?: Department[];

    /** 属于该部门的用户列表（多对多） */
    @ManyToMany(() => User, (user) => user.departments)
    @JoinTable({
        name: 'user_departments',
        joinColumn: { name: 'departmentId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
    })
    users!: User[];
}
