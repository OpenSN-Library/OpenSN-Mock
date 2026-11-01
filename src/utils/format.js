export function formatBytes(bytes, digits = 2) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  let result = value
  while (result >= 1024 && index < units.length - 1) {
    result /= 1024
    index += 1
  }
  return `${result.toFixed(index === 0 ? 0 : digits)} ${units[index]}`
}

/** 后端返回的资源数值单位是字节，这里转成 MB 便于展示 */
export function formatMB(bytes, digits = 2) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '0 MB'
  return `${(value / (1 << 20)).toFixed(digits)} MB`
}

/** nano_cpu 与百分比换算：1e9 nano 等于 100% */
export function formatNanoCpu(nanoCpu) {
  const value = Number(nanoCpu)
  if (!Number.isFinite(value)) return '-'
  return `${(value / 1e7).toFixed(1)}%`
}

/** 把 0~1 的小数格式化为百分比 */
export function formatRatio(ratio, digits = 1) {
  const value = Number(ratio)
  if (!Number.isFinite(value)) return '0%'
  return `${(value * 100).toFixed(digits)}%`
}

export function formatNumber(value, digits = 2) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return num.toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

/** 后端时间字段（如 2026-10-30T12:00:00Z）转成 HH:MM:SS */
export function formatTimeLabel(time) {
  const timestamp = Date.parse(time)
  if (Number.isNaN(timestamp)) return String(time ?? '')
  const date = new Date(timestamp)
  const pad = (num) => String(num).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
