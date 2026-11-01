import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import { useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { resolveRouteTitle } from '@/router/routes'
import { appConfig } from '@/config/appConfig'

export default function Header({ collapsed, onToggleCollapse }) {
  const location = useLocation()
  const title = resolveRouteTitle(location.pathname) || appConfig.title

  return (
    <header className="header">
      <div className="header-left">
        <span
          className="collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? '展开菜单' : '收起菜单'}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
        <span className="header-title">{title}</span>
        <Tag color="gold" style={{ marginLeft: 12 }}>
          演示数据
        </Tag>
      </div>
      <div className="header-right">
        <ThemeToggle />
      </div>
    </header>
  )
}
