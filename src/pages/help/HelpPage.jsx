import { Typography } from 'antd'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'

const { Paragraph, Text } = Typography

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

function FaqItem({ question, children }) {
  return (
    <Paragraph style={{ color: 'var(--foreground-muted)', marginBottom: 10 }}>
      <Text strong style={{ color: 'var(--foreground)' }}>
        {question}
      </Text>
      {children}
    </Paragraph>
  )
}

export default function HelpPage() {
  return (
    <PageContainer
      title="帮助文档"
      description="各页面的用途、关键字段和常见问题；遇到异常时先按文末的常见问题排查"
    >
      <div className="stack">
        <GlassCard title="概览">
          <Paragraph style={{ color: 'var(--foreground-muted)' }}>
            概览是打开系统后的首页。顶部卡片显示模拟是否运行、部署机器数、网络节点数和链路数，
            下方的运行控制用于启动、停止和重置模拟，也可以上传拓扑配置与节点类型配置。
          </Paragraph>
          <Bullets
            items={[
              '运行状态取后端返回的 running 字段，数据每 8 秒刷新一次，刚启动时数字可能还是上一次采集的结果。',
              '节点类型配置列出后端定义的容器类型，以及每种类型的镜像、CPU 限额和内存限额。',
              '三维拓扑显示带位置数据的网络节点和链路，链路颜色越偏红表示流量越大；可以拖动旋转、滚轮缩放。',
              '在三维视图里双击节点或链路，会在新的标签页里打开对应详情。',
            ]}
          />
        </GlassCard>

        <GlassCard title="节点管理">
          <Paragraph style={{ color: 'var(--foreground-muted)' }}>
            节点管理分为网络节点和部署机器两类，它们不是同一层概念，排查问题时要区分。
          </Paragraph>
          <Bullets
            items={[
              '网络节点是运行在物理机上的容器实例，列表包含 instance_id、名称、类型、启动状态、所属机器编号 node_index 和额外配置 extra。',
              '部署机器是真正承载容器的物理机，列表包含 node_index、主从角色 is_master_node、IPv4/IPv6 地址、二层地址和剩余可部署实例数 free_instance。',
              '节点详情页分为基本信息、资源限额、连接关系和资源曲线，资源曲线可以切换时间范围。',
              '机器列表显示资源占用和剩余可部署实例数，可以用来判断还能新增多少网络节点。',
            ]}
          />
        </GlassCard>

        <GlassCard title="链路管理">
          <Paragraph style={{ color: 'var(--foreground-muted)' }}>
            链路连接两个网络节点，列表和详情都来自后端链路接口。
          </Paragraph>
          <Bullets
            items={[
              '列表包含 link_id、链路类型、是否启用 enable、两端实例 connect_instance 和所属机器编号。',
              '详情包含两端地址信息 address_infos、两端实例信息 end_infos、链路参数 parameter 和扩展配置 extra。',
              '参数里的 connect 为 1 表示链路已连通，0 表示尚未连通；链路连通状态以该值为准。',
              '详情页下方是收发速率、包速率、丢包和错误包曲线，可以切换时间范围；没有曲线时先确认模拟是否在运行。',
            ]}
          />
        </GlassCard>

        <GlassCard title="文件管理">
          <Paragraph style={{ color: 'var(--foreground-muted)' }}>
            文件管理操作的是后端工作目录里的文件，不是浏览器本地文件。左侧是目录树，右侧是文本预览。
          </Paragraph>
          <Bullets
            items={[
              '目录树为懒加载：展开文件夹时才请求该层列表；文件名后面的数字是文件大小。',
              '点击文本文件在右侧查看内容，只能用文本方式预览，二进制文件即使能下载也会显示为乱码。',
              '上传会保存到当前目录：选中文件夹时是该文件夹，选中文件或未选中时是文件所在的目录，上传成功后列表会自动刷新。',
              '下载通过 /file/download 接口获取文件；删除前会二次确认，删除后无法恢复。',
            ]}
          />
        </GlassCard>

        <GlassCard title="数据库查看">
          <Paragraph style={{ color: 'var(--foreground-muted)' }}>
            数据库查看用来查看和修改后端键值数据库里的条目。键按 / 分成层级（例如 /a/b/c），右侧用 JSON 编辑器展示条目内容。
          </Paragraph>
          <Bullets
            items={[
              '条目的值必须是 JSON 字符串；不是合法 JSON 的条目只按文本展示，不能保存，只能删除。',
              '保存会用编辑器里的内容整体覆盖该条目，不会做合并；保存后键列表会重新读取。',
              '删除条目立即生效且无法恢复；修改前先确认键的含义，不确定时先备份原内容。',
              '这些条目可能被后端其他逻辑使用，随意修改可能影响正在运行的模拟环境。',
            ]}
          />
        </GlassCard>

        <GlassCard title="常见问题">
          <FaqItem question="三维视图看不到节点。">
            先确认模拟已启动；节点需要有位置数据（经度、纬度和高度）才会出现在地球上；
            页面每 8 秒刷新一次，启动后可以等一次刷新；还需要浏览器支持 WebGL。
          </FaqItem>
          <FaqItem question="图表没有数据。">
            模拟未启动或启动时间太短时，周期资源还没累积起来；先确认所选时间范围覆盖了运行时段。
            如果后端没有采集到资源，曲线也会为空，可以查看后端日志或资源接口返回。
          </FaqItem>
          <FaqItem question="页面数据全部为空或提示请求失败。">
            通常是后端服务没有启动，或者前端没有走 /api 代理。开发环境下前端会把 /api 代理到本机 8080 端口，
            需要确认后端已监听该端口；可以打开浏览器网络面板查看失败请求，再对照后端日志。
          </FaqItem>
          <FaqItem question="文件列表是空的。">
            当前目录确实没有文件，或者后端工作目录配置有误。可以先上传一个文件，刷新后确认是否出现在列表中。
          </FaqItem>
          <FaqItem question="修改数据库条目后页面没有变化。">
            列表和编辑器读取的是打开或刷新时的数据，刷新页面会重新读取；部分配置要重启模拟后才会生效。
          </FaqItem>
        </GlassCard>
      </div>
    </PageContainer>
  )
}
