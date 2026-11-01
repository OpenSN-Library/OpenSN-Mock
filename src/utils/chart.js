import { formatTimeLabel } from './format'

// 图表统一配色，深色与浅色主题下都能看清
export const CHART_COLORS = ['#5e6ad2', '#22c55e', '#eab308', '#ef4444', '#38bdf8', '#a855f7']

const AXIS_COLOR = '#8b93a7'
const SPLIT_COLOR = 'rgba(148, 163, 184, 0.16)'
const AXIS_LINE_COLOR = 'rgba(148, 163, 184, 0.35)'

/**
 * 生成折线图配置。
 * series: [{ name, data }]
 */
export function buildLineChartOption({ categories = [], series = [], yName = '' }) {
  return {
    color: CHART_COLORS,
    grid: { left: 12, right: 18, top: series.length > 1 ? 38 : 16, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend:
      series.length > 1
        ? {
            top: 0,
            left: 0,
            itemWidth: 12,
            itemHeight: 8,
            textStyle: { color: AXIS_COLOR, fontSize: 12 },
          }
        : undefined,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: categories,
      axisLabel: { color: AXIS_COLOR, fontSize: 11 },
      axisLine: { lineStyle: { color: AXIS_LINE_COLOR } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: yName,
      nameTextStyle: { color: AXIS_COLOR, fontSize: 11 },
      axisLabel: { color: AXIS_COLOR, fontSize: 11 },
      splitLine: { lineStyle: { color: SPLIT_COLOR } },
      axisLine: { show: false },
    },
    series: series.map((item) => ({
      name: item.name,
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.12 },
      data: item.data,
    })),
  }
}

/** 资源记录数组（含 Time 字段）转成横轴时间标签 */
export function recordsToCategories(records = []) {
  return records.map((item) => formatTimeLabel(item.Time))
}

/** 资源记录数组取某个字段，组成一条曲线数据 */
export function recordsToSeries(records = [], field, name) {
  return { name, data: records.map((item) => Number(item[field] ?? 0)) }
}
