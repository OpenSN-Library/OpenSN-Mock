import { Switch } from 'antd'
import { BulbOutlined } from '@ant-design/icons'
import { useTheme } from '@/context/ThemeContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="theme-toggle" title="切换明暗模式">
      <BulbOutlined style={{ color: 'var(--foreground-muted)' }} />
      <Switch
        checked={isDark}
        onChange={toggleTheme}
        checkedChildren="暗"
        unCheckedChildren="亮"
        style={{ backgroundColor: isDark ? 'var(--accent)' : undefined }}
      />
    </div>
  )
}
