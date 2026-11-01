import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { resolveMenuTitle } from '@/router/menu'

const TabsContext = createContext(null)

export function TabsProvider({ children }) {
  const [tabs, setTabs] = useState([])
  const [activeKey, setActiveKey] = useState('')

  const openTab = useCallback((key, title) => {
    setActiveKey(key)
    setTabs((prev) =>
      prev.some((tab) => tab.key === key)
        ? prev
        : [...prev, { key, title: title || resolveMenuTitle(key) || key }],
    )
  }, [])

  const activateTab = useCallback((key) => {
    setActiveKey(key)
  }, [])

  const closeTab = useCallback(
    (key) => {
      const index = tabs.findIndex((tab) => tab.key === key)
      if (index === -1) return null

      const nextTabs = tabs.filter((tab) => tab.key !== key)
      setTabs(nextTabs)

      if (activeKey !== key) return null

      const fallback = nextTabs[index] || nextTabs[nextTabs.length - 1]
      const nextKey = fallback ? fallback.key : ''
      setActiveKey(nextKey)
      return nextKey
    },
    [tabs, activeKey],
  )

  const value = useMemo(
    () => ({ tabs, activeKey, openTab, activateTab, closeTab }),
    [tabs, activeKey, openTab, activateTab, closeTab],
  )

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

export function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('useTabs 必须在 TabsProvider 内使用')
  return ctx
}
