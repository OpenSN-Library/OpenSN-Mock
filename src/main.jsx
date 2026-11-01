import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import 'antd/dist/reset.css'
import '@/styles/theme.css'
import '@/styles/layout.css'
import App from '@/App'
import { ThemeProvider } from '@/context/ThemeContext'

// 演示版使用 HashRouter：地址形如 /#/overview，
// 不依赖服务器做路由回退，放到 GitHub Pages 后刷新页面也不会 404。
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
