import { useCallback, useState } from 'react'
import { App, Button, Descriptions, Empty, Select, Table } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'
import StatusTag from '@/components/common/StatusTag'
import EChart from '@/components/common/EChart'
import { useOpenPage } from '@/hooks/useOpenPage'
import { usePolling } from '@/hooks/usePolling'
import { linkApi, metricsApi, webshellApi } from '@/api'
import { DETAIL_POLL_INTERVAL, RESOURCE_PERIODS } from '@/config/constants'
import { buildLineChartOption, recordsToCategories, recordsToSeries } from '@/utils/chart'

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function LinkDetail({ nodeIndex, linkId }) {
  const { message } = App.useApp()
  const openPage = useOpenPage()

  const [detail, setDetail] = useState(null)
  const [parameter, setParameter] = useState({})
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('10m')
  const [periodData, setPeriodData] = useState({})
  const [dumpUrl, setDumpUrl] = useState('')
  const [dumpLoading, setDumpLoading] = useState(false)

  const loadDetail = useCallback(
    async (silent = true) => {
      // 详情与参数分开处理，其中一个失败时另一个仍能展示
      const [detailResult, parameterResult] = await Promise.allSettled([
        linkApi.detail(nodeIndex, linkId),
        linkApi.parameter(nodeIndex, linkId),
      ])
      if (detailResult.status === 'fulfilled') {
        setDetail(detailResult.value?.data || null)
      }
      if (parameterResult.status === 'fulfilled') {
        setParameter(parameterResult.value?.data || {})
      }
      const failed = [detailResult, parameterResult].find((item) => item.status === 'rejected')
      if (failed && !silent) message.error(failed.reason?.message || '加载链路详情失败')
      setLoading(false)
    },
    [nodeIndex, linkId, message],
  )

  const loadPeriod = useCallback(
    async (targetPeriod = period) => {
      try {
        const res = await metricsApi.periodLink(linkId, targetPeriod)
        setPeriodData(res?.data || {})
      } catch (err) {
        // 轮询请求失败不提示，只记录到控制台
        console.error('加载链路资源曲线失败', err)
      }
    },
    [linkId, period],
  )

  const load = useCallback(async () => {
    await Promise.all([loadDetail(), loadPeriod()])
  }, [loadDetail, loadPeriod])

  usePolling(load, DETAIL_POLL_INTERVAL)

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadDetail(false), loadPeriod()])
  }, [loadDetail, loadPeriod])

  const startDump = async () => {
    setDumpLoading(true)
    try {
      const res = await webshellApi.startLink(linkId, nodeIndex)
      const info = res?.data || {}
      if (!info.addr || !info.port) throw new Error('抓包终端地址为空')
      setDumpUrl(`http://${info.addr}:${info.port}`)
      message.success('抓包终端已启动')
    } catch (err) {
      message.error(err?.message || '启动抓包终端失败')
    } finally {
      setDumpLoading(false)
    }
  }

  const openPeer = (row) => {
    if (!row.instanceId || row.nodeIndex === undefined || row.nodeIndex === null) return
    const path = `/nodes/instance/${row.nodeIndex}/${encodeURIComponent(row.instanceId)}`
    openPage(path, `节点详情 · ${row.instanceId}`)
  }

  const info = detail || {}
  const records = periodData[linkId] || []
  const categories = recordsToCategories(records)
  const throughputOption = buildLineChartOption({
    categories,
    series: [
      recordsToSeries(records, 'send_bps', '发送'),
      recordsToSeries(records, 'recv_bps', '接收'),
    ],
    yName: 'bps',
  })
  const packetOption = buildLineChartOption({
    categories,
    series: [
      recordsToSeries(records, 'send_pps', '发送包'),
      recordsToSeries(records, 'recv_pps', '接收包'),
      recordsToSeries(records, 'send_drop_pps', '发送丢包'),
      recordsToSeries(records, 'recv_drop_pps', '接收丢包'),
      recordsToSeries(records, 'send_err_pps', '发送错误包'),
      recordsToSeries(records, 'recv_err_pps', '接收错误包'),
    ],
    yName: 'pps',
  })

  const basicItems = [
    {
      key: 'link_id',
      label: '链路 ID',
      children: <span className="detail-value">{info.link_id || linkId}</span>,
    },
    { key: 'type', label: '类型', children: info.type || '-' },
    {
      key: 'enable',
      label: '状态',
      children: detail ? (
        <StatusTag status={info.enable ? 'enabled' : 'disabled'} />
      ) : (
        '-'
      ),
    },
    { key: 'node_index', label: '部署机器', children: info.node_index ?? nodeIndex },
  ]

  const parameterRows = Object.entries(parameter || {}).map(([key, value]) => ({
    key,
    name: key,
    value: formatValue(value),
  }))

  const parameterColumns = [
    {
      title: '参数名',
      dataIndex: 'name',
      width: 200,
      render: (value) => <span className="detail-value">{value}</span>,
    },
    {
      title: '参数值',
      dataIndex: 'value',
      render: (value) => <span className="detail-value">{value}</span>,
    },
  ]

  const endInfoRows = (info.end_infos || []).map((item, index) => ({
    key: `${item?.instance_id || 'end'}-${index}`,
    peerIndex: index + 1,
    instanceId: item?.instance_id,
    instanceType: item?.instance_type,
    nodeIndex: item?.end_node_index,
  }))

  const endInfoColumns = [
    {
      title: '端',
      dataIndex: 'peerIndex',
      width: 80,
      render: (value) => `端 ${value}`,
    },
    {
      title: '节点 ID',
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
      title: '节点类型',
      dataIndex: 'instanceType',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: '部署机器',
      dataIndex: 'nodeIndex',
      width: 110,
      render: (value) => value ?? '-',
    },
  ]

  const addressInfos = info.address_infos || []

  return (
    <PageContainer
      title={`链路详情 · ${linkId}`}
      description={
        detail ? `所属机器 ${detail.node_index ?? nodeIndex}` : '链路的配置、流量与抓包入口'
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

        <div className="detail-grid">
          <GlassCard title="链路参数" noPadding>
            <Table
              rowKey="key"
              size="small"
              columns={parameterColumns}
              dataSource={parameterRows}
              pagination={false}
              scroll={{ x: 480 }}
              locale={{ emptyText: <Empty description="暂无链路参数" /> }}
            />
          </GlassCard>

          <GlassCard title="两端信息" noPadding>
            <Table
              rowKey="key"
              size="small"
              columns={endInfoColumns}
              dataSource={endInfoRows}
              pagination={false}
              scroll={{ x: 620 }}
              locale={{ emptyText: <Empty description="暂无两端信息" /> }}
            />
          </GlassCard>
        </div>

        <GlassCard title="链路端地址信息">
          {addressInfos.length ? (
            <div className="chart-grid">
              {addressInfos.map((address, index) => (
                <div key={`address-${index}`}>
                  <div className="info-section-title">端 {index + 1}</div>
                  <Descriptions
                    bordered
                    size="small"
                    column={1}
                    items={Object.entries(address || {}).map(([key, value]) => ({
                      key,
                      label: key,
                      children: <span className="detail-value">{formatValue(value)}</span>,
                    }))}
                  />
                </div>
              ))}
            </div>
          ) : (
            <span className="text-muted">暂无链路端地址信息</span>
          )}
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
              <div className="info-section-title">吞吐量（bps）</div>
              <EChart option={throughputOption} height={260} />
            </div>
            <div>
              <div className="info-section-title">数据包统计（pps）</div>
              <EChart option={packetOption} height={260} />
            </div>
          </div>
        </GlassCard>

        <GlassCard
          title="抓包终端"
          extra={
            <Button type="primary" size="small" loading={dumpLoading} onClick={startDump}>
              启动抓包
            </Button>
          }
        >
          {dumpUrl ? (
            <iframe
              title="抓包终端"
              src={dumpUrl}
              style={{ width: '100%', height: 520, border: 0, borderRadius: 8, background: '#000' }}
            />
          ) : (
            <span className="text-muted">还没有启动抓包终端，点击“启动抓包”新建一个。</span>
          )}
        </GlassCard>
      </div>
    </PageContainer>
  )
}
