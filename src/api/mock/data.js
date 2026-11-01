// 演示版初始数据：三维星座、节点、链路、文件与数据库条目都在这里生成。
// 页面不再请求真实后端，所有数据由浏览器内的模拟接口提供。

const DEG = Math.PI / 180

const PLANE_NAMES = ['A', 'B', 'C']

const GROUND_STATIONS = [
  { id: 'gs-beijing', name: '北京地面站', city: '北京', lon: 116.4, lat: 39.9, nodeIndex: 0 },
  { id: 'gs-shanghai', name: '上海地面站', city: '上海', lon: 121.5, lat: 31.2, nodeIndex: 1 },
  { id: 'gs-xian', name: '西安地面站', city: '西安', lon: 108.9, lat: 34.3, nodeIndex: 2 },
  { id: 'gs-chengdu', name: '成都地面站', city: '成都', lon: 104.1, lat: 30.6, nodeIndex: 0 },
]

const MACHINES = [
  {
    node_index: 0,
    is_master_node: true,
    capacity: 40,
    l_3_addr_v_4: '172.16.208.128',
    l_3_addr_v_6: 'fe80::8c1d:2a01',
    l_2_addr: '00:1d:9c:2a:11:01',
  },
  {
    node_index: 1,
    is_master_node: false,
    capacity: 32,
    l_3_addr_v_4: '172.16.208.129',
    l_3_addr_v_6: 'fe80::8c1d:2a02',
    l_2_addr: '00:1d:9c:2a:11:02',
  },
  {
    node_index: 2,
    is_master_node: false,
    capacity: 28,
    l_3_addr_v_4: '172.16.208.130',
    l_3_addr_v_6: 'fe80::8c1d:2a03',
    l_2_addr: '00:1d:9c:2a:11:03',
  },
]

const TYPE_CONFIG = {
  Satellite: {
    image: 'docker.io/opensn/satellite-router:1.4.2',
    container_envs: { NODE_ROLE: 'satellite', ROUTING_MODE: 'ospf' },
    resource_limit: { nano_cpu: 40000000, memory_byte: 134217728 },
  },
  GroundStation: {
    image: 'docker.io/opensn/ground-station:1.4.2',
    container_envs: { NODE_ROLE: 'ground-station' },
    resource_limit: { nano_cpu: 20000000, memory_byte: 67108864 },
  },
  Gateway: {
    image: 'docker.io/opensn/gateway:1.3.0',
    container_envs: { NODE_ROLE: 'gateway', ROUTING_MODE: 'static' },
    resource_limit: { nano_cpu: 30000000, memory_byte: 100663296 },
  },
}

function pad(value, width = 2) {
  return String(value).padStart(width, '0')
}

function mac(seed) {
  const hex = (value) => pad(value.toString(16), 2)
  return `02:00:${hex(seed)}:${hex(seed * 3 + 1)}:${hex(seed * 7 + 2)}:${hex(seed * 11 + 3)}`
}

function buildSatellites() {
  const satellites = []
  let counter = 0

  PLANE_NAMES.forEach((plane, planeIndex) => {
    for (let slot = 0; slot < 4; slot += 1) {
      counter += 1
      const id = `sat-${plane.toLowerCase()}${slot + 1}`
      const longitude = (planeIndex * 120 + slot * 90 + 12) * DEG
      const latitude = (26 * Math.sin((slot + 1) * 1.15 + planeIndex)) * DEG
      const altitude = 550000 + (slot % 2) * 8000
      satellites.push({
        instance_id: id,
        name: `卫星 ${plane}-${pad(slot + 1)}`,
        type: 'Satellite',
        node_index: counter % 3,
        start: true,
        extra: {
          orbit: '550 km / 53°',
          plane: `轨道面 ${plane}`,
          payload: '星载路由',
        },
        position: { longitude, latitude, altitude },
      })
    }
  })

  return satellites
}

function buildGroundStations() {
  return GROUND_STATIONS.map((station, index) => ({
    instance_id: station.id,
    name: station.name,
    type: 'GroundStation',
    node_index: station.nodeIndex,
    start: true,
    extra: {
      city: station.city,
      antenna: index % 2 === 0 ? 'Ka 频段 3.5 m' : 'Ku 频段 2.4 m',
    },
    position: {
      longitude: station.lon * DEG,
      latitude: station.lat * DEG,
      altitude: 40,
    },
  }))
}

function buildInstances() {
  const instances = buildSatellites().concat(buildGroundStations())
  // 留两个停止状态的实例，方便演示节点启停
  instances[5].start = false
  instances[10].start = false
  return instances
}

function buildLinkDefinitions() {
  const planes = PLANE_NAMES.map((plane) =>
    [1, 2, 3, 4].map((slot) => `sat-${plane.toLowerCase()}${slot}`),
  )

  const definitions = []

  // 同一轨道面内的环形链路
  planes.forEach((ids) => {
    ids.forEach((id, index) => {
      definitions.push({
        type: 'Wireless',
        enable: true,
        connect_instance: [id, ids[(index + 1) % ids.length]],
        parameter: { connect: 1, bandwidth: 1200, delay: 6, loss: 0 },
      })
    })
  })

  // 轨道面之间的跨面链路
  const crossLinks = [
    ['sat-a1', 'sat-b1'],
    ['sat-a2', 'sat-b2'],
    ['sat-b1', 'sat-c1'],
    ['sat-b2', 'sat-c2'],
    ['sat-a3', 'sat-c3'],
    ['sat-b3', 'sat-c4'],
  ]
  crossLinks.forEach(([from, to]) => {
    definitions.push({
      type: 'Wireless',
      enable: true,
      connect_instance: [from, to],
      parameter: { connect: 1, bandwidth: 800, delay: 12, loss: 1 },
    })
  })

  // 星地链路
  const satGround = [
    ['sat-a1', 'gs-beijing'],
    ['sat-b1', 'gs-shanghai'],
    ['sat-c1', 'gs-xian'],
    ['sat-a4', 'gs-chengdu'],
  ]
  satGround.forEach(([sat, ground]) => {
    definitions.push({
      type: 'Wireless',
      enable: true,
      connect_instance: [sat, ground],
      parameter: { connect: 1, bandwidth: 1500, delay: 18, loss: 2 },
    })
  })

  // 地面站之间的有线链路
  definitions.push({
    type: 'Wired',
    enable: true,
    connect_instance: ['gs-beijing', 'gs-shanghai'],
    parameter: { connect: 1, bandwidth: 10000, delay: 2, loss: 0 },
  })
  definitions.push({
    type: 'Wired',
    enable: false,
    connect_instance: ['gs-xian', 'gs-chengdu'],
    parameter: { connect: 0, bandwidth: 10000, delay: 2, loss: 0 },
  })

  return definitions
}

function buildLinks(instances) {
  const instanceMap = Object.fromEntries(instances.map((item) => [item.instance_id, item]))

  return buildLinkDefinitions().map((definition, index) => {
    const [fromId, toId] = definition.connect_instance
    const from = instanceMap[fromId]
    const to = instanceMap[toId]
    const position = index + 1

    return {
      link_id: `link-${pad(position)}`,
      type: definition.type,
      enable: definition.enable,
      connect_instance: [fromId, toId],
      node_index: from?.node_index ?? 0,
      cross_machine: (from?.node_index ?? 0) !== (to?.node_index ?? 0),
      parameter: definition.parameter,
      address_infos: [
        {
          ip: `10.20.${position}.1`,
          ipv6: `fd00:20:${position}::1`,
          mac: mac(position * 2),
          mtu: '1500',
        },
        {
          ip: `10.20.${position}.2`,
          ipv6: `fd00:20:${position}::2`,
          mac: mac(position * 2 + 1),
          mtu: '1500',
        },
      ],
      extra: {
        protocol: definition.type === 'Wired' ? 'Ethernet' : 'S 波段无线',
        encryption: 'AES-256',
      },
    }
  })
}

const DAEMON_LOG = `2026-11-01 09:12:03.112 INFO  daemon start, listen 0.0.0.0:8080
2026-11-01 09:12:03.245 INFO  connect etcd 172.16.208.128:2379 ok
2026-11-01 09:12:03.362 INFO  connect influxdb 172.16.208.128:8086 ok
2026-11-01 09:12:04.108 INFO  node 0 registered, master=true, capacity=40
2026-11-01 09:12:04.226 INFO  node 1 registered, master=false, capacity=32
2026-11-01 09:12:04.331 INFO  node 2 registered, master=false, capacity=28
2026-11-01 09:12:05.014 INFO  sync topology done: 16 instances, 24 links
2026-11-01 09:12:05.302 INFO  emulation start, all containers running
2026-11-01 09:15:31.884 WARN  link-07 loss 1%, delay 12ms exceeds threshold
2026-11-01 09:18:47.120 INFO  heartbeat ok, free instances: 40 / 32 / 28
`

const LINK_LOG = `2026-11-01 09:12:05.310 INFO  link-01 connect  sat-a1 <-> sat-a2  bandwidth=1200kbps
2026-11-01 09:12:05.312 INFO  link-02 connect  sat-a2 <-> sat-a3  bandwidth=1200kbps
2026-11-01 09:12:05.315 INFO  link-13 connect  sat-a1 <-> sat-b1  bandwidth=800kbps
2026-11-01 09:12:05.318 INFO  link-19 connect  sat-a1 <-> gs-beijing bandwidth=1500kbps
2026-11-01 09:15:31.884 WARN  link-07 retransmit 14 packets, loss ratio 0.8%
2026-11-01 09:20:02.014 INFO  link-23 disabled by operator
2026-11-01 09:22:18.531 INFO  link-19 handover to gs-shanghai, keep alive
`

const TOPOLOGY_JSON = JSON.stringify(
  {
    name: '演示星座拓扑',
    instances: [
      { instance_id: 'sat-a1', type: 'Satellite', node_index: 0, start: true },
      { instance_id: 'sat-b1', type: 'Satellite', node_index: 1, start: true },
      { instance_id: 'gs-beijing', type: 'GroundStation', node_index: 0, start: true },
    ],
    links: [
      {
        link_id: 'custom-link-1',
        type: 'Wireless',
        enable: true,
        connect_instance: ['sat-a1', 'sat-b1'],
      },
      {
        link_id: 'custom-link-2',
        type: 'Wireless',
        enable: true,
        connect_instance: ['sat-a1', 'gs-beijing'],
      },
    ],
  },
  null,
  2,
)

function buildFiles() {
  return [
    { path: 'config', isDir: true },
    {
      path: 'config/topology.json',
      isDir: false,
      content: TOPOLOGY_JSON,
    },
    {
      path: 'config/emulation.json',
      isDir: false,
      content: JSON.stringify(
        {
          running: true,
          listen_port: 8080,
          master_address: '172.16.208.128',
          instance_capacity: 1800,
          monitor_interval: 1,
        },
        null,
        2,
      ),
    },
    {
      path: 'config/node-types.json',
      isDir: false,
      content: JSON.stringify(TYPE_CONFIG, null, 2),
    },
    { path: 'logs', isDir: true },
    { path: 'logs/daemon.log', isDir: false, content: DAEMON_LOG },
    { path: 'logs/link.log', isDir: false, content: LINK_LOG },
    { path: 'data', isDir: true },
    {
      path: 'data/satellite-catalog.csv',
      isDir: false,
      content:
        'instance_id,name,type,node_index,orbit\nsat-a1,卫星 A-01,Satellite,0,550km\nsat-b1,卫星 B-01,Satellite,1,550km\nsat-c1,卫星 C-01,Satellite,2,550km\n',
    },
    {
      path: 'data/README.txt',
      isDir: false,
      content: `这是演示环境的文件目录。\n\n上传、下载、删除、预览都在浏览器里完成，不会写入真实服务器。\n刷新页面后目录仍会保留；在概览页点击“重置模拟环境”可以恢复初始文件。\n`,
    },
    { path: 'images', isDir: true },
  ]
}

function buildDatabase(instances, links) {
  const connectedLinks = links.filter(
    (item) => item.enable && item.parameter && item.parameter.connect === 1,
  ).length

  return {
    '/config/emulation': JSON.stringify(
      {
        running: true,
        master_address: '172.16.208.128',
        listen_port: 8080,
        instance_capacity: 1800,
        monitor_interval: 1,
      },
      null,
      2,
    ),
    '/config/node/0': JSON.stringify(
      {
        node_index: 0,
        is_master_node: true,
        capacity: 40,
        addresses: { ipv4: '172.16.208.128', ipv6: 'fe80::8c1d:2a01' },
      },
      null,
      2,
    ),
    '/config/node/1': JSON.stringify(
      {
        node_index: 1,
        is_master_node: false,
        capacity: 32,
        addresses: { ipv4: '172.16.208.129', ipv6: 'fe80::8c1d:2a02' },
      },
      null,
      2,
    ),
    '/config/link/link-01': JSON.stringify(
      {
        link_id: 'link-01',
        type: 'Wireless',
        parameter: { connect: 1, bandwidth: 1200, delay: 6, loss: 0 },
      },
      null,
      2,
    ),
    '/config/link/link-19': JSON.stringify(
      {
        link_id: 'link-19',
        type: 'Wireless',
        parameter: { connect: 1, bandwidth: 1500, delay: 18, loss: 2 },
      },
      null,
      2,
    ),
    '/topology/planes': JSON.stringify(
      {
        planes: PLANE_NAMES.map((name) => `轨道面 ${name}`),
        satellites: instances.filter((item) => item.type === 'Satellite').length,
        ground_stations: instances.filter((item) => item.type === 'GroundStation').length,
      },
      null,
      2,
    ),
    '/status/links/summary': JSON.stringify(
      {
        total: links.length,
        connected: connectedLinks,
        disabled: links.filter((item) => !item.enable).length,
        updated_by: 'opensn-demo',
      },
      null,
      2,
    ),
    '/raw/plain-text':
      '这条记录不是 JSON，用来演示数据库查看页的只读文本模式。\n真实环境里这种条目需要先在别处改成合法 JSON 才能编辑。',
  }
}

function timestamp(daysAgo, hour) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, 20, 0, 0)
  return date.toISOString()
}

/** 生成一份全新的演示数据，重置按钮也会用到 */
export function createSeedState() {
  const instances = buildInstances()
  const links = buildLinks(instances)
  const positions = {}

  instances.forEach((item) => {
    positions[item.instance_id] = item.position
  })

  const files = buildFiles().map((item, index) => ({
    ...item,
    size: item.isDir ? 0 : new TextEncoder().encode(item.content || '').length,
    last_modify_time: timestamp(index % 5, 9 + (index % 8)),
  }))

  return JSON.parse(
    JSON.stringify({
      version: 1,
      running: true,
      started_at: new Date().toISOString(),
      typeConfig: TYPE_CONFIG,
      machines: MACHINES,
      instances,
      links,
      positions,
      files,
      database: buildDatabase(instances, links),
    }),
  )
}

export { MACHINES }
