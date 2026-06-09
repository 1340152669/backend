import type { Express } from 'express';
import supertest from 'supertest';

/**
 * 测试辅助函数
 */

/** 创建已认证的 SuperTest 请求（带 Bearer Token） */
export function authRequest(app: Express, token: string) {
  const agent = supertest.agent(app);
  return {
    get: (url: string) => agent.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => agent.post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => agent.put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => agent.patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => agent.delete(url).set('Authorization', `Bearer ${token}`),
  };
}
