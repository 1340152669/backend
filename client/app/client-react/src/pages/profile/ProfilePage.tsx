import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { updateUser } from '@/api/user'
import { changePassword } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProfilePage() {
  const authStore = useAuthStore()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [changingPwd, setChangingPwd] = useState(false)

  useEffect(() => {
    if (authStore.user) { setNickname(authStore.user.nickname || ''); setEmail(authStore.user.email || '') }
  }, [authStore.user])

  const handleSave = async () => {
    if (!authStore.user) return; setSaving(true)
    try {
      await updateUser(authStore.user.id, { nickname, email })
      if (authStore.user) { authStore.user.nickname = nickname; authStore.user.email = email }
      toast({ title: '基本信息更新成功' })
    } catch { toast({ title: '保存失败', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleChangePwd = async () => {
    if (newPwd !== confirmPwd) { toast({ title: '两次密码不一致', variant: 'destructive' }); return }
    if (newPwd.length < 6) { toast({ title: '密码至少6位', variant: 'destructive' }); return }
    setChangingPwd(true)
    try { await changePassword({ oldPassword: oldPwd, newPassword: newPwd }); toast({ title: '密码修改成功' }); setOldPwd(''); setNewPwd(''); setConfirmPwd('') }
    catch { toast({ title: '密码修改失败', variant: 'destructive' }) }
    finally { setChangingPwd(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Tabs defaultValue="basic">
        <TabsList className="mb-4"><TabsTrigger value="basic">个人设置</TabsTrigger><TabsTrigger value="advanced">高级设置</TabsTrigger></TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>用户名</Label><Input value={authStore.user?.username || ''} disabled /></div>
              <div className="space-y-2"><Label>昵称</Label><Input value={nickname} onChange={e => setNickname(e.target.value)} /></div>
              <div className="space-y-2"><Label>邮箱</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
              <Button onClick={handleSave} loading={saving}>保存修改</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>修改密码</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>原密码</Label><Input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} /></div>
              <div className="space-y-2"><Label>新密码</Label><Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} /></div>
              <div className="space-y-2"><Label>确认新密码</Label><Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} /></div>
              <Button onClick={handleChangePwd} loading={changingPwd}>修改密码</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>深色模式</CardTitle></CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => {
                const dark = document.documentElement.getAttribute('data-theme') === 'dark'
                document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark')
              }}>切换主题</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
