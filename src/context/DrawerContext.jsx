import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import DrawerHost from '@/components/common/DrawerHost'

const DEFAULT_CONFIG = {
  title: '',
  content: null,
  footer: null,
  extra: null,
  width: 520,
  placement: 'right',
  className: '',
  onClose: null,
}

const DrawerContext = createContext(null)

export function DrawerProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState(DEFAULT_CONFIG)

  const openDrawer = useCallback((options = {}) => {
    setConfig({ ...DEFAULT_CONFIG, ...options })
    setOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setOpen(false)
    setConfig((prev) => {
      if (typeof prev.onClose === 'function') prev.onClose()
      return prev
    })
  }, [])

  const value = useMemo(
    () => ({ open, config, openDrawer, closeDrawer }),
    [open, config, openDrawer, closeDrawer],
  )

  return (
    <DrawerContext.Provider value={value}>
      {children}
      <DrawerHost open={open} config={config} onClose={closeDrawer} />
    </DrawerContext.Provider>
  )
}

export function useDrawer() {
  const ctx = useContext(DrawerContext)
  if (!ctx) throw new Error('useDrawer 必须在 DrawerProvider 内使用')
  return ctx
}
