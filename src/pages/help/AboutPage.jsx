import { Typography } from 'antd'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'
import { appConfig } from '@/config/appConfig'

const { Paragraph, Text } = Typography

const TECH_STACK = [
  { name: 'React 18', detail: '函数组件与 Hooks，负责页面与状态管理' },
  { name: 'Vite 5', detail: '开发服务器与构建工具，@ 别名指向 src 目录' },
  { name: 'Ant Design 5', detail: '表格、表单、树、弹窗等基础组件' },
  { name: 'ECharts 5', detail: '绘制节点与链路的资源曲线' },
  { name: 'Cesium', detail: '三维地球与拓扑展示，通过 resium 集成' },
  { name: 'vanilla-jsoneditor', detail: '数据库条目与 JSON 配置的查看和编辑' },
  { name: '浏览器模拟数据', detail: '拦截接口请求，在浏览器内生成节点、链路、资源和文件数据' },
]

const DIRECTORIES = [
  'src/pages/：各功能页面，按业务分目录',
  'src/components/：通用组件与布局组件',
  'src/api/：接口模块；src/api/mock/ 下是演示用的模拟数据和模拟接口',
  'src/hooks/、src/context/：轮询、标签页、抽屉等复用逻辑',
  'src/styles/：主题变量与布局样式',
  'src/router/：路由、菜单与面包屑配置',
  'public/mock-terminal.html：演示用的模拟终端页面',
]

function mutedStyle(extra = {}) {
  return { color: 'var(--foreground-muted)', marginBottom: 8, ...extra }
}

function Bullets({ items }) {
  return (
    <ul
      style={{
        margin: '0 0 4px',
        paddingLeft: 20,
        color: 'var(--foreground-muted)',
        lineHeight: 1.8,
      }}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export default function AboutPage() {
  return (
    <PageContainer title="关于" description="项目简介、版本、技术栈与文档位置">
      <div className="stack">
        <GlassCard title="项目简介">
          <Paragraph style={{ color: 'var(--foreground-muted)' }}>
            {appConfig.title}演示版（{appConfig.name} Web UI）。页面数据由浏览器内的模拟接口生成，
            不请求后端，也不会连接真实设备，可以单独放到 GitHub Pages 上展示。
          </Paragraph>
          <div className="metric-list">
            <div className="metric-item">
              <div className="metric-label">当前版本</div>
              <div className="metric-value">2.1.0</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">构建工具</div>
              <div className="metric-value">Vite 5</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">数据来源</div>
              <div className="metric-value">浏览器模拟</div>
            </div>
          </div>
        </GlassCard>

        <div className="split-2">
          <GlassCard title="技术栈">
            {TECH_STACK.map((item) => (
              <Paragraph key={item.name} style={mutedStyle()}>
                <Text strong style={{ color: 'var(--foreground)' }}>
                  {item.name}
                </Text>
                <span>　{item.detail}</span>
              </Paragraph>
            ))}
          </GlassCard>

          <GlassCard title="文档与目录">
            <Paragraph style={mutedStyle()}>
              <Text strong style={{ color: 'var(--foreground)' }}>
                目录结构
              </Text>
              <span>说明见本目录下的 docs/项目结构.md。</span>
            </Paragraph>
            <Paragraph style={mutedStyle()}>
              <Text strong style={{ color: 'var(--foreground)' }}>
                版本变更
              </Text>
              <span>记录在本目录下的 change-logs/ 中，每次改动一份文件。</span>
            </Paragraph>
            <ul
              style={{
                margin: '4px 0 0',
                paddingLeft: 20,
                color: 'var(--foreground-muted)',
                lineHeight: 1.8,
              }}
            >
              {DIRECTORIES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <GlassCard title="与 ui-new 的关系">
          <Paragraph style={{ color: 'var(--foreground-muted)' }}>
            本仓库从 ui-new 复制而来，把接口请求换成了浏览器内的模拟实现，用来在 GitHub Pages 上演示界面和交互。
            真实的 OpenSN 项目仍使用 ui-new 连接后端运行，目前版本号为 2.1.0。
          </Paragraph>
          <Bullets
            items={[
              'ui-new 是连接真实后端的前端版本，ui-mock 是只用于演示的静态版本。',
              '两个版本的页面、布局和接口调用方式保持一致，便于同步修改。',
              '演示数据保存在浏览器本地，清理浏览器数据或点击重置即可恢复。',
            ]}
          />
        </GlassCard>
      </div>
    </PageContainer>
  )
}
