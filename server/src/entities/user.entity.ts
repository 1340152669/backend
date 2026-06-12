import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Department } from './department.entity.js';
import { Role } from './role.entity.js';

/** 用户账号状态枚举（数字型，便于扩展） */
export enum UserStatus {
  // 账号已禁用，无法登录
  DISABLED = 0,
  // 账号正常
  ENABLED = 1,
}

@Entity('users')
export class User extends BaseEntity {
  // 登录用户名，唯一约束，长度 1-50
  @Column({ type: 'varchar', unique: true, length: 50 })
  username!: string;

  // 邮箱地址，唯一约束
  @Column({ type: 'varchar', unique: true, length: 100 })
  email!: string;

  // BCrypt 加密后的密码哈希，默认查询不返回此字段
  @Column({ type: 'varchar', select: false })
  password!: string;

  // 账号状态：1=启用 / 0=禁用
  @Column({ type: 'smallint', default: UserStatus.ENABLED })
  status!: UserStatus;

  // 用户昵称（可选），用于页面展示
  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname?: string;

  // 手机号（可选），用于联系
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  // 用户关联的角色，多对多映射到 user_roles 表
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles!: Role[];

  // 用户所属部门列表，多对多映射到 user_departments 表
  @ManyToMany(() => Department, (dept) => dept.users)
  departments!: Department[];
}
