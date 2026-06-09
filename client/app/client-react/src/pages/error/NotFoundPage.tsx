export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
      <h1 className="text-7xl font-extralight text-foreground">404</h1>
      <p className="text-lg mt-2">页面未找到</p>
      <p className="text-sm text-border mt-1">请检查路由配置或权限设置</p>
    </div>
  )
}
