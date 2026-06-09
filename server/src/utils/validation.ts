/**
 * 共用 Zod 校验规则
 *
 * @remarks
 * - 设计原理：集中管理跨模块复用的校验规则，避免各 validator 重复定义
 * - 所有 Schema 均为 z.ZodString 待组合片段，调用方通过 `.optional()` / `.nullable()` 做最终组装
 *
 * @example
 * // 直接作为字段校验
 * const schema = z.object({ phone: phoneSchema });
 * // 组合为可选字段
 * const schema = z.object({ phone: phoneSchema.optional() });
 */
import { z } from 'zod';

/**
 * 中国大陆手机号校验
 *
 * @remarks
 * - 匹配 1 开头，第二位 3-9，后接 9 位数字，共 11 位
 * - 覆盖移动/联通/电信/广电全号段
 *
 * @example
 * phoneSchema.parse('13800138000')   // ✓
 * phoneSchema.parse('12345678901')   // ✗ 第二位非 3-9
 */
export const phoneSchema = z.string().regex(
  /^1[3-9]\d{9}$/,
  '手机号格式不正确，请输入11位中国大陆手机号',
);

/**
 * 密码通用校验
 *
 * @remarks
 * - 长度 6-100 位，不限复杂度（业务层如有需要可链式追加 .regex）
 *
 * @example
 * passwordSchema.parse('abc123')     // ✓
 */
export const passwordSchema = z.string().min(6, '密码至少6个字符').max(100, '密码最多100个字符');

/**
 * 用户名通用校验
 *
 * @remarks
 * - 长度 2-50 位
 *
 * @example
 * usernameSchema.parse('admin')      // ✓
 */
export const usernameSchema = z.string().min(2, '用户名至少2个字符').max(50, '用户名最多50个字符');

/**
 * 邮箱通用校验
 *
 * @remarks
 * - 最大 100 字符
 */
export const emailSchema = z.string().email('邮箱格式不正确').max(100);

/**
 * UUID 字符串校验
 *
 * @remarks
 * - 空字符串也会通过（如需必填请在调用方组合）
 */
export const uuidSchema = z.string().uuid('ID格式不正确');

/**
 * 昵称通用校验
 *
 * @remarks
 * - 最大 50 字符
 */
export const nicknameSchema = z.string().max(50, '昵称最多50个字符');
