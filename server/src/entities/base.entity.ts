import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 实体基类 — 所有实体继承此基类获得公共字段
 * 使用 UUID 主键 + 自动时间戳 + 软删除
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt?: Date;
}
