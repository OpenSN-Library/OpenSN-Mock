// 资源监控可选的时间范围，与后端 /resource/period 接口的 period 参数一致
export const RESOURCE_PERIODS = [
  { value: '1m', label: '过去 1 分钟' },
  { value: '5m', label: '过去 5 分钟' },
  { value: '10m', label: '过去 10 分钟' },
  { value: '30m', label: '过去 30 分钟' },
  { value: '1h', label: '过去 1 小时' },
  { value: '3h', label: '过去 3 小时' },
  { value: '6h', label: '过去 6 小时' },
  { value: '12h', label: '过去 12 小时' },
  { value: '24h', label: '过去 24 小时' },
]

// 数据自动刷新间隔（毫秒）
export const POLL_INTERVAL = 8000

// 详情页资源曲线的刷新间隔（毫秒）
export const DETAIL_POLL_INTERVAL = 5000
