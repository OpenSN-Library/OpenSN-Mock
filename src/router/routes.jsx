import Overview from '@/pages/overview/Overview'
import NodeList from '@/pages/nodes/NodeList'
import MachineList from '@/pages/nodes/MachineList'
import NodeDetail from '@/pages/nodes/NodeDetail'
import LinkList from '@/pages/links/LinkList'
import LinkDetail from '@/pages/links/LinkDetail'
import FileManager from '@/pages/files/FileManager'
import DatabaseViewer from '@/pages/database/DatabaseViewer'
import HelpPage from '@/pages/help/HelpPage'
import AboutPage from '@/pages/help/AboutPage'
import { resolveMenuTitle } from './menu'

export const appRoutes = [
  { path: '/overview', element: <Overview /> },
  { path: '/nodes/instances', element: <NodeList /> },
  { path: '/nodes/machines', element: <MachineList /> },
  {
    path: '/nodes/instance/:nodeIndex/:instanceId',
    title: (params) => `节点详情 · ${params.instanceId}`,
    element: (params) => (
      <NodeDetail nodeIndex={params.nodeIndex} instanceId={params.instanceId} />
    ),
  },
  { path: '/links/list', element: <LinkList /> },
  {
    path: '/links/link/:nodeIndex/:linkId',
    title: (params) => `链路详情 · ${params.linkId}`,
    element: (params) => <LinkDetail nodeIndex={params.nodeIndex} linkId={params.linkId} />,
  },
  { path: '/files', element: <FileManager /> },
  { path: '/database', element: <DatabaseViewer /> },
  { path: '/help/manual', element: <HelpPage /> },
  { path: '/help/about', element: <AboutPage /> },
]

function matchDynamicRoute(pattern, pathname) {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null

  const params = {}
  for (let i = 0; i < patternParts.length; i += 1) {
    const segment = patternParts[i]
    if (segment.startsWith(':')) {
      params[segment.slice(1)] = decodeURIComponent(pathParts[i])
    } else if (segment !== pathParts[i]) {
      return null
    }
  }
  return params
}

function matchRoute(pathname) {
  let dynamicMatch = null
  for (const route of appRoutes) {
    if (route.path === pathname) return { route, params: {} }
    if (!dynamicMatch && route.path.includes('/:')) {
      const params = matchDynamicRoute(route.path, pathname)
      if (params) dynamicMatch = { route, params }
    }
  }
  return dynamicMatch
}

export function resolveRouteElement(pathname) {
  const matched = matchRoute(pathname)
  if (!matched) return null
  const { route, params } = matched
  return typeof route.element === 'function' ? route.element(params) : route.element
}

export function resolveRouteTitle(pathname) {
  const matched = matchRoute(pathname)
  if (!matched) return ''
  const { route, params } = matched
  if (typeof route.title === 'function') return route.title(params)
  return route.title || resolveMenuTitle(pathname) || pathname
}
