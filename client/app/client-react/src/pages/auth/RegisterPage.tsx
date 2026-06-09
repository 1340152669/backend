import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', nickname: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('两次密码输入不一致'); return }
    if (form.password.length < 6) { setError('密码至少6个字符'); return }
    setLoading(true); setError('')
    try {
      await authStore.registerUser({ username: form.username, email: form.email, password: form.password, nickname: form.nickname || undefined })
      navigate('/')
    } catch (err: any) { setError(err?.response?.data?.message || err?.message || '注册失败') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">创建账号</CardTitle>
          <CardDescription>注册新用户以使用系统</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>用户名 <span className="text-destructive">*</span></Label><Input value={form.username} onChange={update('username')} placeholder="2～50 个字符" required /></div>
            <div className="space-y-2"><Label>邮箱 <span className="text-destructive">*</span></Label><Input type="email" value={form.email} onChange={update('email')} placeholder="请输入邮箱地址" required /></div>
            <div className="space-y-2"><Label>昵称</Label><Input value={form.nickname} onChange={update('nickname')} placeholder="选填" /></div>
            <div className="space-y-2"><Label>密码 <span className="text-destructive">*</span></Label><Input type="password" value={form.password} onChange={update('password')} placeholder="至少6个字符" required /></div>
            <div className="space-y-2"><Label>确认密码 <span className="text-destructive">*</span></Label><Input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="再次输入密码" required /></div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>注册</Button>
            <p className="text-sm text-muted-foreground text-center">已有账号？<Link to="/login" className="text-primary hover:underline">立即登录</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
