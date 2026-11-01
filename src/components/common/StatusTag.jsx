import { Tag } from 'antd'

const STATUS_MAP = {
  running: { color: 'processing', label: '运行中' },
  stopped: { color: 'default', label: '未运行' },
  enabled: { color: 'success', label: '已启用' },
  disabled: { color: 'default', label: '已禁用' },
  connected: { color: 'success', label: '已连接' },
  disconnected: { color: 'default', label: '未连接' },
  master: { color: 'gold', label: '主节点' },
  worker: { color: 'blue', label: '从节点' },
  success: { color: 'success', label: '成功' },
  error: { color: 'error', label: '失败' },
  warning: { color: 'warning', label: '告警' },
}

export default function StatusTag({ status, label, color }) {
  const preset = STATUS_MAP[status]
  return <Tag color={color || preset?.color || 'default'}>{label || preset?.label || status}</Tag>
}
