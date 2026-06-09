import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity.js';
import { Permission } from './permission.entity.js';
import { User } from './user.entity.js';

@Entity('roles')
export class Role extends BaseEntity {
  // 角色标识名（如 admin / user），用于代码判断，唯一约束
  @Column({ type: 'varchar', unique: true, length: 50 })
  name!: string;

  // 角色显示名（如 "系统管理员" / "普通用户"），用于页面展示
  @Column({ type: 'varchar', length: 100 })
  label!: string;

  // 角色描述（可选）
  @Column({ type: 'text', nullable: true })
  description?: string;

  // 角色状态：1=启用 / 0=禁用
  @Column({ type: 'tinyint', default: 1 })
  status!: 0 | 1;

  // 系统预置角色标识，为 true 时不可删除、不可禁用
  @Column({ type: 'boolean', default: false })
  isSystem!: boolean;

  // 拥有此角色的用户列表，多对多反向映射
  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];

  // 角色关联的权限列表，多对多映射到 role_permissions 表
  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions!: Permission[];
}
