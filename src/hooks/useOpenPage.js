import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTabs } from '@/context/TabsContext'

/**
 * 打开一个页面：既在当前布局里新建标签，又同步浏览器地址。
 * 列表页点击“查看详情”时使用，替代原来的 window.open。
 */
export function useOpenPage() {
  const navigate = useNavigate()
  const { openTab } = useTabs()

  return useCallback(
    (path, title) => {
      openTab(path, title)
      navigate(path)
    },
    [navigate, openTab],
  )
}
