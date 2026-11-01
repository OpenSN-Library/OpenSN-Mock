import { Empty, Table } from 'antd'
import GlassCard from '@/components/common/GlassCard'
import { formatMB, formatNanoCpu } from '@/utils/format'

const columns = [
  {
    title: '类型名称',
    dataIndex: 'typeName',
    width: 180,
  },
  {
    title: '镜像',
    dataIndex: 'image',
    render: (value) => <span className="detail-value">{value || '-'}</span>,
  },
  {
    title: 'CPU 限额',
    dataIndex: 'nanoCpu',
    width: 130,
    render: (value) => formatNanoCpu(value),
  },
  {
    title: '内存限额',
    dataIndex: 'memoryByte',
    width: 140,
    render: (value) => formatMB(value),
  },
]

export default function NodeTypePanel({ typeConfig }) {
  const rows = Object.entries(typeConfig || {}).map(([typeName, config]) => ({
    key: typeName,
    typeName,
    image: config?.image,
    nanoCpu: config?.resource_limit?.nano_cpu,
    memoryByte: config?.resource_limit?.memory_byte,
  }))

  return (
    <GlassCard
      title="节点类型配置"
      extra={<span className="text-subtle">共 {rows.length} 种</span>}
      noPadding
    >
      <Table
        rowKey="key"
        size="small"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 720 }}
        locale={{ emptyText: <Empty description="还没有配置节点类型" /> }}
      />
    </GlassCard>
  )
}
