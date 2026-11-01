import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useTheme } from '@/context/ThemeContext'
import { DrawerProvider } from '@/context/DrawerContext'
import { TabsProvider } from '@/context/TabsContext'
import AppRoutes from '@/router'

export default function App() {
  const { isDark } = useTheme()

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? '#5e6ad2' : '#4f46e5',
          borderRadius: 10,
          fontFamily:
            "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      }}
    >
      <AntdApp>
        <DrawerProvider>
          <TabsProvider>
            <AppRoutes />
          </TabsProvider>
        </DrawerProvider>
      </AntdApp>
    </ConfigProvider>
  )
}
