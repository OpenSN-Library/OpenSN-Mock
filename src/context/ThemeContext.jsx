import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { appConfig } from '@/config/appConfig'

const ThemeContext = createContext(null)

function applyTheme(theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.toggle('dark', theme === 'dark')
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(appConfig.themeStorageKey)
      if (stored === 'light' || stored === 'dark') return stored
    } catch (e) {
      /* 浏览器禁用本地存储时忽略 */
    }
    return 'dark'
  })

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(appConfig.themeStorageKey, theme)
    } catch (e) {
      /* 忽略写入失败 */
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', toggleTheme, setTheme }),
    [theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return ctx
}
