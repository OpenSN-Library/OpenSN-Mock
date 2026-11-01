import { useRef } from 'react'
import { App, Button } from 'antd'
import {
  CaretRightOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import GlassCard from '@/components/common/GlassCard'
import { emulationApi } from '@/api'
import { formatMB, formatRatio } from '@/utils/format'

export default function RuntimeControls({ running, resource, onChanged }) {
  const { message } = App.useApp()
  const topologyInputRef = useRef(null)
  const typeInputRef = useRef(null)

  const runAction = async (action, successText) => {
    try {
      await action()
      message.success(successText)
      await onChanged?.()
    } catch (err) {
      message.error(err.message || '操作失败')
    }
  }

  const handleFileChange = (event, upload, successText) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const payload = JSON.parse(reader.result)
        await upload(payload)
        message.success(successText)
        await onChanged?.()
      } catch (err) {
        message.error(`导入失败：${err.message || '文件内容不是合法的 JSON'}`)
      }
    }
    reader.readAsText(file)
  }

  return (
    <GlassCard title="运行控制">
      <div className="stack">
        <div className="toolbar">
          <Button
            type="primary"
            icon={running ? <PauseCircleOutlined /> : <CaretRightOutlined />}
            danger={running}
            onClick={() =>
              runAction(
                () => (running ? emulationApi.stop() : emulationApi.start()),
                running ? '已停止模拟' : '已启动模拟',
              )
            }
          >
            {running ? '停止模拟' : '启动模拟'}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => runAction(() => emulationApi.reset(), '已重置模拟环境')}
          >
            重置模拟环境
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => topologyInputRef.current?.click()}>
            上传拓扑配置
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => typeInputRef.current?.click()}>
            上传节点类型配置
          </Button>
          <input
            ref={topologyInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(event) =>
              handleFileChange(event, (payload) => emulationApi.addTopology(payload), '拓扑配置已导入')
            }
          />
          <input
            ref={typeInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(event) =>
              handleFileChange(event, (payload) => emulationApi.updateInstanceTypes(payload), '节点类型配置已导入')
            }
          />
        </div>

        <div className="metric-list">
          <div className="metric-item">
            <div className="metric-label">CPU 使用率</div>
            <div className="metric-value">{formatRatio(resource.cpu)}</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">内存占用</div>
            <div className="metric-value">{formatMB(resource.mem)}</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">交换内存占用</div>
            <div className="metric-value">{formatMB(resource.swap)}</div>
          </div>
        </div>

        <div className="text-subtle" style={{ fontSize: 'var(--fs-xs)' }}>
          上传的配置文件会应用到当前演示数据，不会发送到后端。
        </div>
      </div>
    </GlassCard>
  )
}
