import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const authStore = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || password.length < 6) { setError('请填写完整信息'); return }
    setLoading(true); setError('')
    try {
      await authStore.login({ username, password })
      navigate(searchParams.get('redirect') || '/')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '登录失败')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">RBAC 管理系统</CardTitle>
          <CardDescription>请登录您的账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>登录</Button>
            <p className="text-sm text-muted-foreground text-center">
              还没有账号？<Link to="/register" className="text-primary hover:underline">立即注册</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
