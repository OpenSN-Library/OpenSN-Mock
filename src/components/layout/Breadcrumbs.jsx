import { Breadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { Link, useLocation } from 'react-router-dom'
import { resolveBreadcrumb } from '@/router/menu'

export default function Breadcrumbs() {
  const location = useLocation()
  const trail = resolveBreadcrumb(location.pathname)
  const items = []

  const first = trail[0]
  if (!first || first.key !== '/overview') {
    items.push({
      title: (
        <Link to="/overview">
          <HomeOutlined /> 首页
        </Link>
      ),
    })
  }

  trail.forEach((node, index) => {
    const isLast = index === trail.length - 1
    if (isLast || !node.key) {
      items.push({ title: node.label })
      return
    }
    items.push({ title: <Link to={node.key}>{node.label}</Link> })
  })

  return (
    <div className="breadcrumb-bar">
      <Breadcrumb items={items} />
    </div>
  )
}
