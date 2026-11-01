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
]

const DIRECTORIES = [
  'src/pages/：各功能页面，按业务分目录',
  'src/components/：通用组件与布局组件',
  'src/api/：后端接口模块，统一挂在 /api 下',
  'src/hooks/、src/context/：轮询、标签页、抽屉等复用逻辑',
  'src/styles/：主题变量与布局样式',
  'src/router/：路由、菜单与面包屑配置',
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
            {appConfig.title}前端（{appConfig.name} Web UI），用于{appConfig.description}。
            界面为中文，页面数据全部来自后端接口，不在浏览器中保存业务数据。
          </Paragraph>
          <div className="metric-list">
            <div className="metric-item">
              <div className="metric-label">当前版本</div>
              <div className="metric-value">2.0.0</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">构建工具</div>
              <div className="metric-value">Vite 5</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">接口前缀</div>
              <div className="metric-value">/api</div>
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

        <GlassCard title="与旧版 ui 的关系">
          <Paragraph style={{ color: 'var(--foreground-muted)' }}>
            仓库里的 ui/ 是旧版前端，ui-new/ 是在保留后端接口的前提下重写的前端版本：
            路由、通用组件、样式和页面结构都重新组织过，目前版本号为 2.0.0。
          </Paragraph>
          <Bullets
            items={[
              '旧版 ui/ 暂时保留，便于对照旧功能和旧数据，不再作为主要开发目标。',
              '新版页面只在 ui-new/ 中维护；两边调用同一套后端接口，但不要同时操作同一个模拟环境。',
              '如果旧版和新版对同一数据的展示不一致，以后端接口返回和新版页面为准。',
            ]}
          />
        </GlassCard>
      </div>
    </PageContainer>
  )
}
