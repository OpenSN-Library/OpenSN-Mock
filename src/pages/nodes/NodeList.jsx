import { useCallback, useMemo, useState } from 'react'
import { App, Button, Empty, Input, Space, Table } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'
import StatusTag from '@/components/common/StatusTag'
import { useOpenPage } from '@/hooks/useOpenPage'
import { usePolling } from '@/hooks/usePolling'
import { instanceApi } from '@/api'
import { POLL_INTERVAL } from '@/config/constants'

function rowKeyOf(record) {
  return `${record.node_index}-${record.instance_id}`
}

export default function NodeList() {
  const { message } = App.useApp()
  const openPage = useOpenPage()

  const [instances, setInstances] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [actingKey, setActingKey] = useState('')

  const load = useCallback(
    async (silent = true) => {
      try {
        const res = await instanceApi.list()
        setInstances(res?.data || [])
      } catch (err) {
        if (!silent) message.error(err?.message || '加载网络节点列表失败')
      } finally {
        setLoading(false)
      }
    },
    [message],
  )

  usePolling(load, POLL_INTERVAL)

  const refresh = useCallback(async () => {
    setLoading(true)
    await load(false)
  }, [load])

  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return instances
    return instances.filter((item) =>
      [item.instance_id, item.name, item.type].some((value) =>
        String(value ?? '').toLowerCase().includes(text),
      ),
    )
  }, [instances, keyword])

  const openDetail = (record) => {
    const path = `/nodes/instance/${record.node_index}/${encodeURIComponent(record.instance_id)}`
    openPage(path, `节点详情 · ${record.instance_id}`)
  }

  const toggleRun = async (record) => {
    const key = rowKeyOf(record)
    setActingKey(key)
    try {
      if (record.start) {
        await instanceApi.stop(record.node_index, record.instance_id)
      } else {
        await instanceApi.start(record.node_index, record.instance_id)
      }
      message.success(`${record.instance_id} 已${record.start ? '停止' : '启动'}`)
      await load()
    } catch (err) {
      message.error(err?.message || `${record.start ? '停止' : '启动'}节点失败`)
    } finally {
      setActingKey('')
    }
  }

  const columns = [
    {
      title: '节点 ID',
      dataIndex: 'instance_id',
      width: 200,
      render: (value) => <span className="detail-value">{value}</span>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: '部署机器',
      dataIndex: 'node_index',
      width: 110,
    },
    {
      title: '状态',
      dataIndex: 'start',
      width: 110,
      render: (value) => <StatusTag status={value ? 'running' : 'stopped'} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => openDetail(record)}>
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            loading={actingKey === rowKeyOf(record)}
            onClick={() => toggleRun(record)}
          >
            {record.start ? '停止' : '启动'}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer
      title="网络节点列表"
      description="模拟环境中的容器化网络节点，支持启动、停止与查看详情"
      actions={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
          刷新
        </Button>
      }
    >
      <GlassCard>
        <div className="toolbar" style={{ marginBottom: 14 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="按名称 / ID / 类型筛选"
            style={{ width: 300 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <span className="text-muted">
            共 {instances.length} 个节点，当前显示 {filtered.length} 个
          </span>
        </div>

        <Table
          rowKey={rowKeyOf}
          size="small"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 900 }}
          locale={{
            emptyText: (
              <Empty
                description={keyword ? '没有匹配的网络节点' : '还没有网络节点，请先启动模拟环境'}
              />
            ),
          }}
        />
      </GlassCard>
    </PageContainer>
  )
}
