import { useEffect, useRef, useState } from 'react'
import {
  buildModuleUrl,
  Cartesian2,
  Cartesian3,
  Color,
  TileMapServiceImageryProvider,
} from 'cesium'
import {
  Entity,
  Globe,
  ImageryLayer,
  LabelGraphics,
  PointGraphics,
  PolylineGraphics,
  Scene,
  Viewer,
  useCesium,
} from 'resium'
import { useTabs } from '@/context/TabsContext'

const DEFAULT_LINK_COLOR = '#5e6ad2'
const GLOBE_COLOR = Color.fromCssColorString('#050506')
const BACKGROUND_COLOR = Color.fromCssColorString('#050506')
// Cesium 自带的世界地图瓦片，放在本地资源目录里，不依赖在线地图服务
const EARTH_IMAGERY_URL = buildModuleUrl('Assets/Textures/NaturalEarthII')

function positionToCartesian(position) {
  return Cartesian3.fromRadians(position.longitude, position.latitude, position.altitude)
}

/**
 * Cesium 默认会在点击时选中实体、在双击时把相机锁定到实体上。
 * 本页的交互是“双击打开详情标签页”，不需要保留选中/跟踪状态，
 * 所以这里在点击后把状态清掉，避免出现无法取消的选中效果。
 */
function CesiumSelectionCleaner() {
  const { viewer } = useCesium()

  useEffect(() => {
    if (!viewer || viewer.isDestroyed?.()) return undefined
    const canvas = viewer.scene.canvas

    const clearSelection = () => {
      // 放到下一轮事件循环，等 Cesium 和 resium 自己处理完点击再清理
      window.setTimeout(() => {
        if (viewer.isDestroyed?.()) return
        viewer.selectedEntity = undefined
        viewer.trackedEntity = undefined
      }, 0)
    }

    canvas.addEventListener('click', clearSelection)
    canvas.addEventListener('dblclick', clearSelection)
    return () => {
      canvas.removeEventListener('click', clearSelection)
      canvas.removeEventListener('dblclick', clearSelection)
    }
  }, [viewer])

  return null
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
  const [earthImagery, setEarthImagery] = useState(null)

  // 加载 Cesium 自带的本地地球影像，保证离线或 GitHub Pages 环境下也能看到地球
  useEffect(() => {
    let cancelled = false
    TileMapServiceImageryProvider.fromUrl(EARTH_IMAGERY_URL)
      .then((provider) => {
        if (!cancelled) setEarthImagery(provider)
      })
      .catch((error) => {
        console.error('加载地球影像失败', error)
      })
    return () => {
      cancelled = true
    }
  }, [])

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
        infoBox={false}
        selectionIndicator={false}
        baseLayer={false}
      >
        <CesiumSelectionCleaner />
        {earthImagery && <ImageryLayer imageryProvider={earthImagery} />}
        <Globe baseColor={GLOBE_COLOR} showGroundAtmosphere enableLighting={false} />
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
