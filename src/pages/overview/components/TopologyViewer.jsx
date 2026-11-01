import { useEffect, useRef } from 'react'
import { Cartesian2, Cartesian3, Color } from 'cesium'
import { Entity, Globe, LabelGraphics, PointGraphics, PolylineGraphics, Scene, Viewer } from 'resium'
import { useTabs } from '@/context/TabsContext'

const DEFAULT_LINK_COLOR = '#5e6ad2'
const GLOBE_COLOR = Color.fromCssColorString('#050506')
const BACKGROUND_COLOR = Color.fromCssColorString('#050506')

function positionToCartesian(position) {
  return Cartesian3.fromRadians(position.longitude, position.latitude, position.altitude)
}

export default function TopologyViewer({
  instances,
  links,
  positions,
  linkParameters,
  running,
  linkColors,
  onOpenInstance,
  onOpenLink,
}) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const { activeKey } = useTabs()

  // 标签页切换后容器尺寸会变化，通知 Cesium 重新计算画布大小
  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      viewerRef.current?.cesiumElement?.resize()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (activeKey === '/overview') {
      viewerRef.current?.cesiumElement?.resize()
    }
  }, [activeKey])

  const positionedInstances = instances.filter((item) => positions[item.instance_id])

  const visibleLinks = links.filter((link) => {
    if (!running) return false
    const parameter = linkParameters[link.link_id]
    if (!parameter || parameter.connect !== 1) return false
    return (link.connect_instance || []).every((instanceId) => positions[instanceId])
  })

  return (
    <div className="viewer-box" ref={containerRef}>
      <Viewer
        ref={viewerRef}
        style={{ width: '100%', height: '100%' }}
        timeline={false}
        animation={false}
        homeButton={false}
        geocoder={false}
        navigationHelpButton={false}
        fullscreenButton={false}
        baseLayerPicker={false}
        sceneModePicker={false}
        infoBox={false}
        selectionIndicator={false}
        baseLayer={false}
      >
        <Globe baseColor={GLOBE_COLOR} showGroundAtmosphere={false} enableLighting={false} />
        <Scene backgroundColor={BACKGROUND_COLOR} />

        {positionedInstances.map((instance) => (
          <Entity
            key={instance.instance_id}
            name={instance.instance_id}
            position={positionToCartesian(positions[instance.instance_id])}
            onDoubleClick={() => onOpenInstance?.(instance)}
          >
            <PointGraphics pixelSize={9} color={Color.fromCssColorString('#38bdf8')} />
            <LabelGraphics
              text={instance.name || instance.instance_id}
              font="13px sans-serif"
              fillColor={Color.fromCssColorString('#ededef')}
              showBackground
              backgroundColor={Color.fromCssColorString('rgba(5, 5, 6, 0.72)')}
              pixelOffset={new Cartesian2(0, 14)}
            />
          </Entity>
        ))}

        {visibleLinks.map((link) => {
          const [fromId, toId] = link.connect_instance
          const from = positions[fromId]
          const to = positions[toId]
          const positionsArray = Cartesian3.fromRadiansArrayHeights([
            from.longitude,
            from.latitude,
            from.altitude,
            to.longitude,
            to.latitude,
            to.altitude,
          ])
          return (
            <Entity
              key={link.link_id}
              name={link.link_id}
              onDoubleClick={() => onOpenLink?.(link)}
            >
              <PolylineGraphics
                positions={positionsArray}
                width={1.6}
                material={Color.fromCssColorString(linkColors[link.link_id] || DEFAULT_LINK_COLOR)}
              />
            </Entity>
          )
        })}
      </Viewer>

      {!positionedInstances.length && (
        <div className="viewer-empty-hint">暂无可显示的位置数据，请先导入拓扑并启动模拟</div>
      )}
    </div>
  )
}
