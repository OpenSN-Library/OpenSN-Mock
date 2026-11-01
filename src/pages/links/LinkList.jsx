import { useCallback, useMemo, useState } from 'react'
import { App, Button, Empty, Input, Select, Table } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'
import StatusTag from '@/components/common/StatusTag'
import { useOpenPage } from '@/hooks/useOpenPage'
import { usePolling } from '@/hooks/usePolling'
import { linkApi } from '@/api'
import { POLL_INTERVAL } from '@/config/constants'

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'enabled', label: '已启用' },
  { value: 'disabled', label: '已禁用' },
]

function rowKeyOf(record) {
  return `${record.node_index}-${record.link_id}`
}

export default function LinkList() {
  const { message } = App.useApp()
  const openPage = useOpenPage()

  const [links, setLinks] = useState([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (silent = true) => {
      try {
        const res = await linkApi.list()
        setLinks(res?.data || [])
      } catch (err) {
        if (!silent) message.error(err?.message || '加载链路列表失败')
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
    return links.filter((item) => {
      if (status !== 'all' && Boolean(item.enable) !== (status === 'enabled')) return false
      if (!text) return true
      return [item.link_id, item.type, ...(item.connect_instance || [])].some((value) =>
        String(value ?? '').toLowerCase().includes(text),
      )
    })
  }, [links, keyword, status])

  const openDetail = (record) => {
    const path = `/links/link/${record.node_index}/${encodeURIComponent(record.link_id)}`
    openPage(path, `链路详情 · ${record.link_id}`)
  }

  const columns = [
    {
      title: '链路 ID',
      dataIndex: 'link_id',
      width: 200,
      render: (value) => <span className="detail-value">{value}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'enable',
      width: 110,
      render: (value) => <StatusTag status={value ? 'enabled' : 'disabled'} />,
    },
    {
      title: '两端节点',
      dataIndex: 'connect_instance',
      render: (value) => {
        const [from, to] = value || []
        return (
          <span className="detail-value">
            {from || '-'} ↔ {to || '-'}
          </span>
        )
      },
    },
    {
      title: '部署机器',
      dataIndex: 'node_index',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      render: (_, record) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <PageContainer
      title="链路列表"
      description="模拟环境中的虚拟链路，可查看链路状态与两端节点"
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
            placeholder="按链路 ID / 类型 / 节点筛选"
            style={{ width: 300 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            value={status}
            style={{ width: 150 }}
            options={STATUS_OPTIONS}
            onChange={setStatus}
          />
          <span className="text-muted">
            共 {links.length} 条链路，当前显示 {filtered.length} 条
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
                description={keyword || status !== 'all' ? '没有匹配的链路' : '还没有创建链路'}
              />
            ),
          }}
        />
      </GlassCard>
    </PageContainer>
  )
}
