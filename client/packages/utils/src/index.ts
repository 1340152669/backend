/**
 * @rbac/utils — 通用工具函数库
 *
 * 设计原则：
 * - 纯函数，无运行时依赖
 * - 不包含业务实体类型（业务类型请从 @rbac/client 导入）
 * - 每个工具函数独立导出，支持 tree-shaking
 *
 * 用法：
 * ```ts
 * import { formatDate, isValidEmail } from '@rbac/utils'
 * ```
 */

export { formatDate, formatDateTime } from './helpers/format'
export { isValidEmail, isValidRoleName, createSchemaValidator, emailSchema, roleNameSchema } from './helpers/validate'
