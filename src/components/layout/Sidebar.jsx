import { useEffect, useState } from 'react'
import { Menu } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { menuConfig, resolveMenuSelection, resolveOpenKey } from '@/router/menu'

export default function Sidebar({ collapsed }) {
  const location = useLocation()
  const navigate = useNavigate()

  const openKey = resolveOpenKey(location.pathname)
  const [openKeys, setOpenKeys] = useState(openKey ? [openKey] : [])

  useEffect(() => {
    if (openKey && !collapsed) {
      setOpenKeys((prev) => (prev.includes(openKey) ? prev : [...prev, openKey]))
    }
  }, [openKey, collapsed])

  const menuProps = collapsed ? {} : { openKeys, onOpenChange: setOpenKeys }
  const selectedKey = resolveMenuSelection(location.pathname)

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <span className="logo-icon">
          <GlobalOutlined />
        </span>
        {!collapsed && <span className="logo-text">OpenSN</span>}
      </div>
      <div className="sidebar-menu">
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={menuConfig}
          onClick={({ key }) => navigate(key)}
          {...menuProps}
        />
      </div>
    </aside>
  )
}
