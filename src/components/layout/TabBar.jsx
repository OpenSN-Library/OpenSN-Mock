import { CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTabs } from '@/context/TabsContext'

export default function TabBar() {
  const { tabs, activeKey, activateTab, closeTab } = useTabs()
  const navigate = useNavigate()

  if (!tabs.length) return null

  const handleActivate = (key) => {
    if (key === activeKey) return
    activateTab(key)
    navigate(key)
  }

  const handleClose = (key, event) => {
    event?.stopPropagation()
    const nextKey = closeTab(key)
    if (nextKey !== null) navigate(nextKey || '/overview')
  }

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={`tab-item${tab.key === activeKey ? ' active' : ''}`}
          title={tab.title}
          onClick={() => handleActivate(tab.key)}
          onDoubleClick={() => handleClose(tab.key)}
        >
          <span className="tab-title">{tab.title}</span>
          <span
            className="tab-close"
            onClick={(event) => handleClose(tab.key, event)}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <CloseOutlined />
          </span>
        </div>
      ))}
    </div>
  )
}
