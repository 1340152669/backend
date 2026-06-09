# RBAC 后台管理系统

基于 **Express 5 + TypeORM + MySQL** 后端与 **Vue 3 + Pinia + Vite** 前端的企业级 RBAC 权限管理后台系统。

> 系统采用前后端分离架构，支持用户管理、角色管理、权限管理（菜单/按钮级）、部门管理等核心功能，满足多租户场景下的细粒度权限控制需求。

---

## 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [API 概览](#api-概览)
- [数据模型](#数据模型)
- [权限体系](#权限体系)
- [开发命令](#开发命令)
- [测试](#测试)
- [文档](#文档)

---

## 技术栈

### 后端（server/）

| 技术 | 说明 |
| ------ | ------ |
| **Express 5** | HTTP 服务框架 |
| **TypeORM** | ORM 数据访问层（支持 MySQL） |
| **MySQL** | 关系型数据库 |
| **JWT** | 基于 JSON Web Token 的认证方案 |
| **Zod** | 请求参数校验 |
| **TypeScript** | 类型安全的开发语言 |
| **bcryptjs** | 密码加密 |
| **Vitest + Supertest** | 单元与集成测试 |

### 前端（client/）

| 技术 | 说明 |
| ------ | ------ |
| **Vue 3** | 前端框架（Composition API） |
| **Pinia** | 状态管理 |
| **Vue Router** | 前端路由（含导航守卫权限控制） |
| **Vite** | 构建工具 |
| **TailwindCSS** | 原子化 CSS |
| **TypeScript** | 类型安全语言 |
| **pnpm** | 包管理（Monorepo） |

---

## 项目结构

```
├── server/                    # 后端服务
│   ├── src/
│   │   ├── index.ts           # 应用启动入口
│   │   ├── app.ts             # Express 应用工厂
│   │   ├── config/            # 全局配置（环境变量读取）
│   │   ├── entities/          # TypeORM 实体（User / Role / Permission / Department）
│   │   ├── repositories/      # 数据访问层
│   │   ├── services/          # 业务逻辑层
│   │   ├── controllers/       # HTTP 请求处理器
│   │   ├── routes/            # 路由定义（/api/v1）
│   │   ├── middlewares/        # JWT 认证 / 权限校验 / 参数校验 / 错误处理
│   │   ├── validators/        # Zod 校验 Schema
│   │   ├── constants/         # 业务错误码枚举
│   │   ├── lib/               # 权限编码常量
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── utils/             # 工具函数（统一响应、异常类、异步包装）
│   │   └── seed.ts            # 数据库初始化种子脚本
│   ├── tests/                 # 测试
│   └── package.json
│
├── client/                    # 前端应用（pnpm Monorepo）
│   ├── app/client/            # 主应用（视图层 + 业务逻辑）
│   ├── packages/requests/     # HTTP 请求库（Axios 封装）
│   ├── packages/ui/           # 通用 UI 组件库
│   └── packages/utils/        # 通用工具函数
│
├── docs/                      # 开发文档
└── README.md                  # 本文件
```

---

## 环境要求

- **Node.js** >= 20.19.0 或 >= 22.12.0
- **MySQL** >= 8.0
- **pnpm** 推荐（前端使用），npm 也可用于后端

---

## 快速开始

### 1. 克隆项目并安装依赖

```bash
# 后端依赖
cd server
npm install

# 前端依赖
cd ../client
pnpm install
```

### 2. 配置环境变量

```bash
# 后端配置 — 复制并编辑 server/.env
cd ../server
cp .env .env.local   # 或直接编辑 .env
```

环境变量说明见下文 [环境变量](#环境变量) 章节。

### 3. 初始化数据库

确保 MySQL 服务已启动，然后创建数据库：

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS backend DEFAULT CHARACTER SET utf8mb4;"
```

### 4. 启动服务端

```bash
cd server
npm run dev
```

服务启动后,终端会打印：

- 服务端口（默认 `3000`）
- API 基础路径 `http://localhost:3000/api/v1`
- 健康检查地址 `http://localhost:3000/api/health`

### 5. 初始化种子数据（首次运行）

新数据库首次运行时，需执行种子脚本创建默认权限、角色和账号：

```bash
cd server
npm run seed
```

种子数据会创建：

- **权限**：系统管理 → 用户/角色/权限/部门 四个模块的完整菜单与按钮权限
- **角色**：`admin`（系统管理员，拥有所有权限）、`user`（普通用户，仅查看权限）
- **管理员账号**：`admin` / `admin123`

> 种子脚本是**幂等**的，可重复执行，不会重复创建已有数据。

### 6. 启动前端

```bash
cd client
pnpm dev
```

前端默认运行在 `http://localhost:5173`。

---

## 环境变量

| 变量名 | 默认值 | 说明 |
| -------- | -------- | ------ |
| `NODE_ENV` | `development` | 运行环境（development / production / test） |
| `PORT` | `3000` | 服务监听端口 |
| `DB_HOST` | `localhost` | MySQL 主机地址 |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_USER` | `root` | MySQL 用户名 |
| `DB_PASSWORD` | `password` | MySQL 密码 |
| `DB_NAME` | `backend` | MySQL 数据库名 |
| `JWT_SECRET` | `fallback-secret` | JWT 签名密钥（生产环境务必修改） |
| `JWT_EXPIRES_IN` | `7d` | 访问令牌过期时间 |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | 刷新令牌过期时间 |

> 生产环境部署时请务必：
> 1. 修改 `JWT_SECRET` 为一个高强度随机字符串
> 2. 配置正确的数据库连接信息
> 3. 将 `NODE_ENV` 设为 `production`（会自动关闭 `synchronize`）

---

## API 概览

所有 API 以 `/api/v1` 为前缀，认证接口除外，其余接口均需携带 JWT Token。

### 认证

| 方法 | 路径 | 说明 |
| ------ | ------ | ------ |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/register` | 用户注册 |
| GET | `/api/v1/auth/me` | 获取当前用户信息 |
| POST | `/api/v1/auth/refresh` | 刷新 Token |
| POST | `/api/v1/auth/change-password` | 修改密码 |

### 用户管理

| 方法 | 路径 | 权限 | 说明 |
| ------ | ------ | ------ | ------ |
| GET | `/api/v1/users` | `UserRead` | 用户列表（分页） |
| GET | `/api/v1/users/:id` | `UserRead` | 用户详情 |
| POST | `/api/v1/users` | `UserCreate` | 创建用户 |
| PUT | `/api/v1/users/:id` | `UserUpdate` | 更新用户 |
| DELETE | `/api/v1/users/:id` | `UserDelete` | 删除用户 |
| PATCH | `/api/v1/users/:id/status` | `UserUpdate` | 切换用户状态 |
| PUT | `/api/v1/users/:id/roles` | `UserUpdate` | 分配角色 |
| PATCH | `/api/v1/users/:id/reset-password` | `UserUpdate` | 重置密码 |

### 角色管理

| 方法 | 路径 | 权限 | 说明 |
| ------ | ------ | ------ | ------ |
| GET | `/api/v1/roles` | `RoleRead` | 角色列表 |
| GET | `/api/v1/roles/:id` | `RoleRead` | 角色详情 |
| POST | `/api/v1/roles` | `RoleCreate` | 创建角色 |
| PUT | `/api/v1/roles/:id` | `RoleUpdate` | 更新角色 |
| DELETE | `/api/v1/roles/:id` | `RoleDelete` | 删除角色 |
| PUT | `/api/v1/roles/:id/permissions` | `RoleUpdate` | 绑定权限（全量覆盖） |
| PATCH | `/api/v1/roles/:id/status` | `RoleUpdate` | 切换角色状态 |
| GET | `/api/v1/roles/:id/users/count` | `RoleRead` | 角色下用户计数 |

### 权限管理

| 方法 | 路径 | 权限 | 说明 |
| ------ | ------ | ------ | ------ |
| GET | `/api/v1/permissions` | `PermissionRead` | 权限树 |
| GET | `/api/v1/permissions/list` | `PermissionRead` | 权限扁平列表 |
| GET | `/api/v1/permissions/dimensions` | `PermissionRead` | 权限维度统计 |
| GET | `/api/v1/permissions/:id` | `PermissionRead` | 权限详情 |
| POST | `/api/v1/permissions` | `PermissionCreate` | 创建权限 |
| PUT | `/api/v1/permissions/:id` | `PermissionUpdate` | 更新权限 |
| DELETE | `/api/v1/permissions/:id` | `PermissionDelete` | 删除权限 |

### 部门管理

| 方法 | 路径 | 权限 | 说明 |
| ------ | ------ | ------ | ------ |
| GET | `/api/v1/departments` | `DeptRead` | 部门树 |
| GET | `/api/v1/departments/:id` | `DeptRead` | 部门详情 |
| POST | `/api/v1/departments` | `DeptCreate` | 创建部门 |
| PUT | `/api/v1/departments/:id` | `DeptUpdate` | 更新部门 |
| DELETE | `/api/v1/departments/:id` | `DeptDelete` | 删除部门 |
| PATCH | `/api/v1/departments/:id/status` | `DeptUpdate` | 切换部门状态 |
| PUT | `/api/v1/departments/:id/users` | `DeptUpdate` | 分配用户（全量覆盖） |

### 健康检查

| 方法 | 路径 | 说明 |
| ------ | ------ | ------ |
| GET | `/api/health` | 服务健康检查 |

### 统一响应格式

所有 API 响应遵循统一结构：

```json
{
  "code": 0,           // 业务状态码（0 为成功）
  "message": "success",
  "data": { ... }      // 业务数据
}
```

错误码说明：

| 错误码 | 含义 |
| -------- | ------ |
| `0` | 请求成功 |
| `1000` | 未知错误 |
| `1001` | 资源不存在 |
| `1002` | 未认证（Token 缺失） |
| `1003` | 无权限 |
| `1004` | 参数校验失败 |
| `1005` | 资源冲突（如用户名已存在） |
| `1006` | 账号已禁用 |
| `1007` | 账号或密码错误 |
| `1008` | Token 过期 |

---

## 数据模型

用户、角色、权限、部门四个核心实体通过多对多关联构成 RBAC 权限体系：

```
┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│   User   │────▶│   user_roles     │◀────│    Role      │
│ (users)  │     │  userId, roleId  │     │   (roles)    │
└──────────┘     └──────────────────┘     └──────┬───────┘
       │                                         │
       │   ┌──────────────────┐     ┌────────────┴───────┐
       └──▶│ user_departments │     │  role_permissions   │
           │ userId, deptId   │     │ roleId, permId     │
           └──────────────────┘     └────────────────────┘
                                                  │
                                         ┌────────┴────────┐
                                         │   Permission    │
                                         │  (permissions)  │
                                         │ parentId (自关联)│
                                         └─────────────────┘
```

- **用户 (User)**：可关联多个角色和多个部门
- **角色 (Role)**：可关联多个用户和多个权限；支持系统预置角色（不可删除）
- **权限 (Permission)**：自关联树形结构，支持三级类型（目录 → 菜单 → 按钮）
- **部门 (Department)**：自关联树形结构，支持无限层级

### 权限类型

| 类型 | 说明 | 示例 |
| ------ | ------ | ------ |
| `directory` | 目录（侧边栏分组） | 系统设置 |
| `menu` | 菜单（可访问页面） | 用户管理 |
| `button` | 按钮（页面内操作） | 创建用户、删除用户 |

---

## 权限体系

### 中间件校验链

每个受保护接口经过以下中间件链：

```
请求 → Zod 参数校验 → JWT 认证 → 权限校验 → 控制器处理
```

### 前端权限控制

前端通过以下方式实现权限隔离：

- **路由守卫** — `router.beforeEach` 检查用户是否已认证以及是否拥有目标路由的权限
- **指令控制** — `v-permission` 指令根据权限编码控制按钮/元素的显示与隐藏
- **API 拦截** — 请求返回 401 时自动触发 Token 续期或跳转登录页

### 权限编码约定

权限编码采用 `system:module:action` 三级命名：

- `system` — 系统设置（目录）
- `system:user` — 用户管理（菜单）
- `system:user:read` — 查看用户（按钮）

---

## 开发命令

### 后端（server/）

| 命令 | 说明 |
| ------ | ------ |
| `npm run dev` | 开发模式启动（tsx watch，热重载） |
| `npm run build` | TypeScript 编译 |
| `npm start` | 生产模式启动 |
| `npm run typecheck` | 类型检查 |
| `npm test` | 运行测试 |
| `npm run test:coverage` | 测试覆盖率报告 |
| `npm run seed` | 数据库种子数据初始化 |
| `npm run clean` | 清空编译产物 |

### 前端（client/）

| 命令 | 说明 |
| ------ | ------ |
| `pnpm dev` | 开发模式启动（Vite HMR） |
| `pnpm build` | 生产构建 |
| `pnpm preview` | 预览生产构建 |
| `pnpm test:unit` | 运行单元测试 |
| `pnpm lint` | ESLint 代码检查 |
| `pnpm format` | Prettier 代码格式化 |

---

## 测试

框架采用 **Vitest + Supertest**，测试文件位于 `server/tests/`。

```bash
# 运行所有测试
cd server && npm test

# 监视模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```



