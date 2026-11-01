import { useCallback, useRef, useState } from 'react'
import { App, Button, Descriptions, Empty, Select, Table, Tabs } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'
import StatusTag from '@/components/common/StatusTag'
import EChart from '@/components/common/EChart'
import { useOpenPage } from '@/hooks/useOpenPage'
import { usePolling } from '@/hooks/usePolling'
import { instanceApi, metricsApi, webshellApi } from '@/api'
import { DETAIL_POLL_INTERVAL, RESOURCE_PERIODS } from '@/config/constants'
import { formatMB, formatNanoCpu } from '@/utils/format'
import { buildLineChartOption, recordsToCategories, recordsToSeries } from '@/utils/chart'

/** 把字节单位的曲线数据换算成 MB */
function toMB(series) {
  return {
    name: series.name,
    data: series.data.map((value) => Number((value / (1 << 20)).toFixed(2))),
  }
}

export default function NodeDetail({ nodeIndex, instanceId }) {
  const { message } = App.useApp()
  const openPage = useOpenPage()
  const sessionSeq = useRef(0)

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('10m')
  const [periodData, setPeriodData] = useState({})
  const [startingTerminal, setStartingTerminal] = useState(false)
  const [sessions, setSessions] = useState([])
  const [activeSessionKey, setActiveSessionKey] = useState('')

  const loadDetail = useCallback(
    async (silent = true) => {
      try {
        const res = await instanceApi.detail(nodeIndex, instanceId)
        setDetail(res?.data || null)
      } catch (err) {
        if (!silent) message.error(err?.message || '加载节点详情失败')
      } finally {
        setLoading(false)
      }
    },
    [nodeIndex, instanceId, message],
  )

  const loadPeriod = useCallback(
    async (targetPeriod = period) => {
      try {
        const res = await metricsApi.periodInstance(instanceId, targetPeriod)
        setPeriodData(res?.data || {})
      } catch (err) {
        // 轮询请求失败不提示，只记录到控制台
        console.error('加载节点资源曲线失败', err)
      }
    },
    [instanceId, period],
  )

  const load = useCallback(async () => {
    await Promise.all([loadDetail(), loadPeriod()])
  }, [loadDetail, loadPeriod])

  usePolling(load, DETAIL_POLL_INTERVAL)

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadDetail(false), loadPeriod()])
  }, [loadDetail, loadPeriod])

  const openLink = (linkId) => {
    const path = `/links/link/${detail?.node_index ?? nodeIndex}/${encodeURIComponent(linkId)}`
    openPage(path, `链路详情 · ${linkId}`)
  }

  const openPeer = (row) => {
    if (!row.instanceId || row.endNodeIndex === undefined || row.endNodeIndex === null) return
    const path = `/nodes/instance/${row.endNodeIndex}/${encodeURIComponent(row.instanceId)}`
    openPage(path, `节点详情 · ${row.instanceId}`)
  }

  const startTerminal = async () => {
    setStartingTerminal(true)
    try {
      const res = await webshellApi.startInstance(nodeIndex, instanceId)
      const info = res?.data || {}
      // 真实后端返回 addr/port，演示版直接返回内置终端页面地址
      const terminalUrl =
        info.url || (info.addr && info.port ? `http://${info.addr}:${info.port}` : '')
      if (!terminalUrl) throw new Error('终端地址为空')
      sessionSeq.current += 1
      const key = `${instanceId}-${sessionSeq.current}`
      setSessions((prev) => [
        ...prev,
        { key, label: `终端 ${sessionSeq.current}`, url: terminalUrl },
      ])
      setActiveSessionKey(key)
      message.success('终端已打开')
    } catch (err) {
      message.error(err?.message || '启动远程终端失败')
    } finally {
      setStartingTerminal(false)
    }
  }

  const closeSession = (targetKey) => {
    const index = sessions.findIndex((item) => item.key === targetKey)
    const next = sessions.filter((item) => item.key !== targetKey)
    setSessions(next)
    if (activeSessionKey === targetKey) {
      const fallback = next[index] || next[next.length - 1]
      setActiveSessionKey(fallback ? fallback.key : '')
    }
  }

  const handleSessionEdit = (targetKey, action) => {
    if (action === 'add') {
      startTerminal()
      return
    }
    closeSession(targetKey)
  }

  const info = detail || {}
  const records = periodData[instanceId] || []
  const categories = recordsToCategories(records)
  const cpuSeries = recordsToSeries(records, 'cpu_usage', 'CPU 使用率')
  const cpuOption = buildLineChartOption({
    categories,
    series: [
      {
        name: 'CPU 使用率',
        data: cpuSeries.data.map((value) => Number((value * 100).toFixed(2))),
      },
    ],
    yName: '%',
  })
  const memoryOption = buildLineChartOption({
    categories,
    series: [
      toMB(recordsToSeries(records, 'mem_byte', '内存')),
      toMB(recordsToSeries(records, 'swap_mem_byte', '交换内存')),
    ],
    yName: 'MB',
  })

  const basicItems = [
    {
      key: 'instance_id',
      label: '节点 ID',
      children: <span className="detail-value">{info.instance_id || instanceId}</span>,
    },
    { key: 'name', label: '名称', children: info.name || '-' },
    { key: 'type', label: '类型', children: info.type || '-' },
    {
      key: 'image',
      label: '镜像',
      children: <span className="detail-value">{info.image || '-'}</span>,
    },
    {
      key: 'start',
      label: '状态',
      children: detail ? (
        <StatusTag status={info.start ? 'running' : 'stopped'} />
      ) : (
        '-'
      ),
    },
    { key: 'node_index', label: '部署机器', children: info.node_index ?? nodeIndex },
    {
      key: 'nano_cpu',
      label: 'CPU 限额',
      children: info.resource_limit ? formatNanoCpu(info.resource_limit.nano_cpu) : '-',
    },
    {
      key: 'memory_byte',
      label: '内存限额',
      children: info.resource_limit ? formatMB(info.resource_limit.memory_byte) : '-',
    },
  ]

  const connectionRows = Object.entries(info.connections || {}).map(([linkId, item]) => ({
    key: linkId,
    linkId,
    instanceId: item?.instance_id,
    instanceType: item?.instance_type,
    endNodeIndex: item?.end_node_index,
  }))

  const connectionColumns = [
    {
      title: '链路 ID',
      dataIndex: 'linkId',
      render: (value) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openLink(value)}>
          {value}
        </Button>
      ),
    },
    {
      title: '对端节点',
      dataIndex: 'instanceId',
      render: (value, record) =>
        value ? (
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openPeer(record)}>
            {value}
          </Button>
        ) : (
          '-'
        ),
    },
    {
      title: '对端类型',
      dataIndex: 'instanceType',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: '对端机器',
      dataIndex: 'endNodeIndex',
      width: 120,
      render: (value) => value ?? '-',
    },
  ]

  const sessionItems = sessions.map((session) => ({
    key: session.key,
    label: session.label,
    closable: true,
    children: (
      <iframe
        title={session.label}
        src={session.url}
        style={{ width: '100%', height: 520, border: 0, borderRadius: 8, background: '#000' }}
      />
    ),
  }))

  return (
    <PageContainer
      title={`节点详情 · ${instanceId}`}
      description={
        detail ? `所属机器 ${detail.node_index ?? nodeIndex}` : '网络节点的配置、资源与终端'
      }
      actions={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
          刷新
        </Button>
      }
    >
      <div className="stack">
        <GlassCard title="基本信息">
          <Descriptions bordered column={2} size="middle" items={basicItems} />
        </GlassCard>

        <GlassCard
          title="资源监控"
          extra={
            <Select
              value={period}
              style={{ width: 140 }}
              options={RESOURCE_PERIODS}
              onChange={(value) => {
                setPeriod(value)
                loadPeriod(value)
              }}
            />
          }
        >
          <div className="chart-grid">
            <div>
              <div className="info-section-title">CPU 使用率（%）</div>
              <EChart option={cpuOption} height={260} />
            </div>
            <div>
              <div className="info-section-title">内存与交换内存（MB）</div>
              <EChart option={memoryOption} height={260} />
            </div>
          </div>
        </GlassCard>

        <GlassCard title="连接信息" noPadding>
          <Table
            rowKey="key"
            size="small"
            columns={connectionColumns}
            dataSource={connectionRows}
            pagination={false}
            scroll={{ x: 760 }}
            locale={{ emptyText: <Empty description="该节点还没有连接其它节点" /> }}
          />
        </GlassCard>

        <GlassCard
          title="远程终端"
          extra={
            <Button type="primary" size="small" loading={startingTerminal} onClick={startTerminal}>
              打开终端
            </Button>
          }
        >
          {sessions.length ? (
            <Tabs
              type="editable-card"
              activeKey={activeSessionKey}
              onChange={setActiveSessionKey}
              onEdit={handleSessionEdit}
              items={sessionItems}
            />
          ) : (
            <span className="text-muted">还没有打开终端会话，点击“打开终端”新建一个。</span>
          )}
        </GlassCard>
      </div>
    </PageContainer>
  )
}
