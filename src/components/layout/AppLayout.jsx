import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Breadcrumbs from './Breadcrumbs'
import TabBar from './TabBar'
import NotFound from '@/pages/NotFound'
import { useTabs } from '@/context/TabsContext'
import { resolveRouteElement, resolveRouteTitle } from '@/router/routes'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const { tabs, activeKey, openTab } = useTabs()
  const isKnown = Boolean(resolveRouteElement(pathname))

  useEffect(() => {
    if (isKnown) openTab(pathname, resolveRouteTitle(pathname))
  }, [pathname, isKnown, openTab])

  // 关闭最后一个标签页后重新打开当前页面，避免内容区变空
  useEffect(() => {
    if (isKnown && tabs.length === 0) openTab(pathname, resolveRouteTitle(pathname))
  }, [isKnown, tabs.length, pathname, openTab])

  return (
    <div className="app-container">
      <div className="app-shell">
        <Sidebar collapsed={collapsed} />
        <div className="app-body">
          <Header collapsed={collapsed} onToggleCollapse={() => setCollapsed((prev) => !prev)} />
          <Breadcrumbs />
          <TabBar />
          <main className="main-content">
            {!isKnown && (
              <div className="tab-pane">
                <NotFound />
              </div>
            )}
            {isKnown &&
              tabs.map((tab) => (
                <div
                  key={tab.key}
                  className="tab-pane"
                  style={{ display: tab.key === activeKey ? 'block' : 'none' }}
                >
                  {resolveRouteElement(tab.key)}
                </div>
              ))}
          </main>
        </div>
      </div>
    </div>
  )
}
