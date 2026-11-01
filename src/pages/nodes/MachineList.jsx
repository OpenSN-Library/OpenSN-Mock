import { useCallback, useMemo, useState } from 'react'
import { App, Button, Empty, Table } from 'antd'
import { ClusterOutlined, DeploymentUnitOutlined, HddOutlined, ReloadOutlined } from '@ant-design/icons'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'
import StatCard from '@/components/common/StatCard'
import StatusTag from '@/components/common/StatusTag'
import { usePolling } from '@/hooks/usePolling'
import { nodeApi } from '@/api'
import { POLL_INTERVAL } from '@/config/constants'

export default function MachineList() {
  const { message } = App.useApp()

  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (silent = true) => {
      try {
        const res = await nodeApi.list()
        setMachines(res?.data || [])
      } catch (err) {
        if (!silent) message.error(err?.message || '加载部署机器列表失败')
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

  const summary = useMemo(
    () => ({
      total: machines.length,
      free: machines.reduce((sum, item) => sum + (Number(item.free_instance) || 0), 0),
      master: machines.filter((item) => item.is_master_node).length,
    }),
    [machines],
  )

  const columns = [
    {
      title: '机器编号',
      dataIndex: 'node_index',
      width: 110,
    },
    {
      title: '角色',
      dataIndex: 'is_master_node',
      width: 110,
      render: (value) => <StatusTag status={value ? 'master' : 'worker'} />,
    },
    {
      title: '剩余可分配节点数',
      dataIndex: 'free_instance',
      width: 160,
    },
    {
      title: 'IPv4',
      dataIndex: 'l_3_addr_v_4',
      render: (value) => <span className="detail-value">{value || '-'}</span>,
    },
    {
      title: 'IPv6',
      dataIndex: 'l_3_addr_v_6',
      render: (value) => <span className="detail-value">{value || '-'}</span>,
    },
    {
      title: 'MAC 地址',
      dataIndex: 'l_2_addr',
      width: 180,
      render: (value) => <span className="detail-value">{value || '-'}</span>,
    },
  ]

  return (
    <PageContainer
      title="部署机器"
      description="运行容器的物理机器，列出角色、剩余可分配节点数与地址信息"
      actions={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
          刷新
        </Button>
      }
    >
      <div className="stack">
        <div className="grid-stats">
          <StatCard
            title="机器总数"
            value={summary.total}
            description="承担容器运行的物理机器"
            icon={<HddOutlined />}
            color="#5e6ad2"
          />
          <StatCard
            title="剩余可分配节点总数"
            value={summary.free}
            description="所有机器剩余名额之和"
            icon={<DeploymentUnitOutlined />}
            color="#22c55e"
          />
          <StatCard
            title="主节点数量"
            value={summary.master}
            description="负责管理调度的机器"
            icon={<ClusterOutlined />}
            color="#38bdf8"
          />
        </div>

        <GlassCard noPadding>
          <Table
            rowKey="node_index"
            size="small"
            columns={columns}
            dataSource={machines}
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 960 }}
            locale={{ emptyText: <Empty description="还没有部署机器" /> }}
          />
        </GlassCard>
      </div>
    </PageContainer>
  )
}
