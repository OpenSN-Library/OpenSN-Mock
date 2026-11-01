import { useCallback, useState } from 'react'
import {
  ClusterOutlined,
  HddOutlined,
  NodeIndexOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'
import StatCard from '@/components/common/StatCard'
import { usePolling } from '@/hooks/usePolling'
import { useOpenPage } from '@/hooks/useOpenPage'
import { emulationApi, instanceApi, linkApi, metricsApi, nodeApi, positionApi } from '@/api'
import { POLL_INTERVAL } from '@/config/constants'
import RuntimeControls from './components/RuntimeControls'
import NodeTypePanel from './components/NodeTypePanel'
import TopologyViewer from './components/TopologyViewer'

const EMPTY_RESOURCE = { cpu: 0, mem: 0, swap: 0 }

function safe(promise) {
  return promise.catch(() => null)
}

function computeLinkColors(resourceMap = {}) {
  const totals = Object.entries(resourceMap).map(([linkId, item]) => [
    linkId,
    (item.send_bps || 0) + (item.recv_bps || 0),
  ])
  const max = totals.reduce((result, [, value]) => Math.max(result, value), 0)
  const colors = {}
  totals.forEach(([linkId, value]) => {
    const ratio = max === 0 ? 0 : value / max
    const red = Math.floor(255 * ratio)
    const green = 255 - red
    colors[linkId] = `rgb(${red}, ${green}, 0)`
  })
  return colors
}

export default function Overview() {
  const openPage = useOpenPage()

  const [running, setRunning] = useState(false)
  const [typeConfig, setTypeConfig] = useState({})
  const [machines, setMachines] = useState([])
  const [instances, setInstances] = useState([])
  const [links, setLinks] = useState([])
  const [positions, setPositions] = useState({})
  const [linkParameters, setLinkParameters] = useState({})
  const [linkColors, setLinkColors] = useState({})
  const [resource, setResource] = useState(EMPTY_RESOURCE)

  const loadTopology = useCallback(async () => {
    const [emulation, machineList, instanceList, linkList, positionMap, parameterMap] =
      await Promise.all([
        safe(emulationApi.getConfig()),
        safe(nodeApi.list()),
        safe(instanceApi.list()),
        safe(linkApi.list()),
        safe(positionApi.list()),
        safe(linkApi.parameterList()),
      ])

    if (emulation?.data) {
      setRunning(Boolean(emulation.data.running))
      setTypeConfig(emulation.data.type_config || {})
    }
    setMachines(machineList?.data || [])
    setInstances(instanceList?.data || [])
    setLinks(linkList?.data || [])
    setPositions(positionMap?.data || {})
    setLinkParameters(parameterMap?.data || {})
  }, [])

  const loadResources = useCallback(async () => {
    const [nodeResources, linkResources] = await Promise.all([
      safe(metricsApi.lastNode()),
      safe(metricsApi.lastLink()),
    ])

    const nodeList = nodeResources?.data || []
    setResource({
      cpu: nodeList.reduce((sum, item) => sum + (item.cpu_usage || 0), 0),
      mem: nodeList.reduce((sum, item) => sum + (item.mem_byte || 0), 0),
      swap: nodeList.reduce((sum, item) => sum + (item.swap_mem_byte || 0), 0),
    })
    setLinkColors(computeLinkColors(linkResources?.data || {}))
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([loadTopology(), loadResources()])
  }, [loadTopology, loadResources])

  usePolling(refresh, POLL_INTERVAL)

  const openInstance = (instance) => {
    const path = `/nodes/instance/${instance.node_index}/${encodeURIComponent(instance.instance_id)}`
    openPage(path, `节点详情 · ${instance.instance_id}`)
  }

  const openLink = (link) => {
    const path = `/links/link/${link.node_index}/${encodeURIComponent(link.link_id)}`
    openPage(path, `链路详情 · ${link.link_id}`)
  }

  return (
    <PageContainer
      title="概览"
      description="查看模拟运行状态、节点类型与三维拓扑，数据每 8 秒自动刷新一次"
    >
      <div className="stack">
        <div className="grid-stats">
          <StatCard
            title="运行状态"
            value={running ? '已启动' : '未启动'}
            description={running ? '模拟环境正在运行' : '模拟环境处于停止状态'}
            icon={<RocketOutlined />}
            color={running ? '#22c55e' : '#64748b'}
          />
          <StatCard
            title="部署机器"
            value={machines.length}
            description="承担容器运行的物理机器"
            icon={<HddOutlined />}
            color="#5e6ad2"
          />
          <StatCard
            title="网络节点"
            value={instances.length}
            description="运行中的容器化网络节点"
            icon={<ClusterOutlined />}
            color="#38bdf8"
          />
          <StatCard
            title="链路"
            value={links.length}
            description="已创建的虚拟链路"
            icon={<NodeIndexOutlined />}
            color="#22c55e"
          />
        </div>

        <RuntimeControls running={running} resource={resource} onChanged={refresh} />

        <NodeTypePanel typeConfig={typeConfig} />

        <GlassCard
          title="三维拓扑视图"
          extra={
            <div className="legend">
              <span>
                <span className="legend-dot" style={{ background: '#38bdf8' }} />
                网络节点
              </span>
              <span>
                <span className="legend-dot" style={{ background: '#22c55e' }} />
                链路（颜色越偏红表示流量越大）
              </span>
            </div>
          }
        >
          <TopologyViewer
            instances={instances}
            links={links}
            positions={positions}
            linkParameters={linkParameters}
            running={running}
            linkColors={linkColors}
            onOpenInstance={openInstance}
            onOpenLink={openLink}
          />
          <div className="topology-hint" style={{ marginTop: 12 }}>
            <span>双击三维视图中的节点或链路，会在标签页中打开详情</span>
            <span>拖动可旋转视角，滚轮可缩放</span>
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  )
}
