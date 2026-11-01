import {
  ApartmentOutlined,
  ClusterOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  HddOutlined,
  InfoCircleOutlined,
  NodeIndexOutlined,
  ReadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'

export const menuConfig = [
  {
    key: '/overview',
    label: '概览',
    icon: <DashboardOutlined />,
  },
  {
    key: '/nodes',
    label: '节点管理',
    icon: <ApartmentOutlined />,
    children: [
      { key: '/nodes/instances', label: '网络节点列表', icon: <ClusterOutlined /> },
      { key: '/nodes/machines', label: '部署机器', icon: <HddOutlined /> },
    ],
  },
  {
    key: '/links',
    label: '链路管理',
    icon: <NodeIndexOutlined />,
    children: [{ key: '/links/list', label: '链路列表', icon: <UnorderedListOutlined /> }],
  },
  {
    key: '/files',
    label: '文件管理',
    icon: <FolderOpenOutlined />,
  },
  {
    key: '/database',
    label: '数据库查看',
    icon: <DatabaseOutlined />,
  },
  {
    key: '/help',
    label: '帮助',
    icon: <ReadOutlined />,
    children: [
      { key: '/help/manual', label: '帮助文档', icon: <FileTextOutlined /> },
      { key: '/help/about', label: '关于', icon: <InfoCircleOutlined /> },
    ],
  },
]

// 详情页不在菜单里展示，但面包屑与菜单选中状态要落到对应的上级条目上
const DETAIL_ROUTES = [
  { prefix: '/nodes/instance/', parent: '/nodes', child: '/nodes/instances', label: '节点详情' },
  { prefix: '/links/link/', parent: '/links', child: '/links/list', label: '链路详情' },
]

export function findMenuTrail(pathname) {
  const detail = DETAIL_ROUTES.find((item) => pathname.startsWith(item.prefix))
  if (detail) {
    const parent = menuConfig.find((item) => item.key === detail.parent)
    const child = parent?.children?.find((item) => item.key === detail.child)
    return [parent, child].filter(Boolean)
  }

  for (const item of menuConfig) {
    if (item.children) {
      const child = item.children.find(
        (c) => pathname === c.key || pathname.startsWith(`${c.key}/`),
      )
      if (child) return [item, child]
      if (pathname === item.key || pathname.startsWith(`${item.key}/`)) return [item]
    } else if (pathname === item.key || pathname.startsWith(`${item.key}/`)) {
      return [item]
    }
  }
  return []
}

export function resolveMenuTitle(pathname) {
  const trail = findMenuTrail(pathname)
  return trail.length ? trail[trail.length - 1].label : ''
}

/** 菜单当前选中项。详情页返回其所属列表页的 key */
export function resolveMenuSelection(pathname) {
  const trail = findMenuTrail(pathname)
  if (!trail.length) return null
  const last = trail[trail.length - 1]
  return last.children ? last.children[0].key : last.key
}

/** 菜单需要展开的一级目录 key */
export function resolveOpenKey(pathname) {
  const trail = findMenuTrail(pathname)
  return trail.length > 1 ? trail[0].key : null
}

/** 面包屑内容：首页 + 菜单层级 + 详情页层级 */
export function resolveBreadcrumb(pathname) {
  const trail = findMenuTrail(pathname)
  const items = trail.map((node) => ({
    label: node.label,
    key: node.children ? node.children[0].key : node.key,
  }))

  const detail = DETAIL_ROUTES.find((item) => pathname.startsWith(item.prefix))
  if (detail) items.push({ label: detail.label, key: null })

  return items
}
