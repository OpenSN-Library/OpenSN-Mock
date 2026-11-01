import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

/**
 * 通用图表容器。option 使用 ECharts 配置，具体图表类型在 utils/chart.js 里统一生成。
 */
export default function EChart({ option, height = 280, className = '' }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const chart = echarts.init(containerRef.current, null, { renderer: 'canvas' })
    chartRef.current = chart

    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.setOption(option, true)
    chartRef.current.resize()
  }, [option])

  return <div ref={containerRef} className={className} style={{ width: '100%', height }} />
}
