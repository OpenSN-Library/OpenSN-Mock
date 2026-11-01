// 演示版状态管理：数据保存在浏览器内存中，并同步写入 localStorage，
// 这样页面刷新后，节点启停、链路删除、文件上传、数据库修改等操作仍然可见。

import { createSeedState } from './data'

const STORAGE_KEY = 'opensn-mock-state-v1'
const STATE_VERSION = 1

let cache = null

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      if (stored && stored.version === STATE_VERSION && stored.state) {
        return stored.state
      }
    }
  } catch (error) {
    // 浏览器禁止本地存储时忽略，使用初始数据
  }
  return createSeedState()
}

export function getState() {
  if (!cache) {
    cache = loadState()
    // 首次进入也写入本地存储，刷新页面后演示数据保持一致
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STATE_VERSION, state: cache }),
      )
    } catch (error) {
      // 浏览器禁止本地存储时忽略
    }
  }
  return cache
}

export function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STATE_VERSION, state: getState() }),
    )
  } catch (error) {
    // 存储空间不足或被禁用时忽略
  }
}

export function resetState() {
  cache = createSeedState()
  saveState()
  // 通知已经打开的页面重新读取演示数据
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('opensn-mock-reset'))
  }
  return cache
}

function findInstance(instanceId) {
  return getState().instances.find((item) => item.instance_id === instanceId)
}

export function setRunning(running) {
  const state = getState()
  state.running = Boolean(running)
  if (running) state.started_at = new Date().toISOString()
  saveState()
}

export function startInstance(nodeIndex, instanceId) {
  const instance = findInstance(instanceId)
  if (!instance) throw new Error(`节点 ${instanceId} 不存在`)
  instance.start = true
  saveState()
}

export function stopInstance(nodeIndex, instanceId) {
  const instance = findInstance(instanceId)
  if (!instance) throw new Error(`节点 ${instanceId} 不存在`)
  instance.start = false
  saveState()
}

export function deleteLink(linkId) {
  const state = getState()
  const before = state.links.length
  state.links = state.links.filter((item) => item.link_id !== linkId)
  if (state.links.length === before) throw new Error(`链路 ${linkId} 不存在`)
  saveState()
}

export function updateTypeConfig(typeConfig) {
  if (!typeConfig || typeof typeConfig !== 'object' || Array.isArray(typeConfig)) {
    throw new Error('节点类型配置需要是一个 JSON 对象')
  }
  const state = getState()
  Object.entries(typeConfig).forEach(([name, config]) => {
    if (!config || typeof config !== 'object') return
    state.typeConfig[name] = {
      image: String(config.image || state.typeConfig[name]?.image || 'demo/node:latest'),
      container_envs: config.container_envs || state.typeConfig[name]?.container_envs || {},
      resource_limit: {
        nano_cpu: Number(config.resource_limit?.nano_cpu || 10000000),
        memory_byte: Number(config.resource_limit?.memory_byte || 33554432),
      },
    }
  })
  saveState()
}

function normalizeInstance(item, index) {
  const instanceId = String(item.instance_id || item.id || `custom-instance-${index + 1}`)
  return {
    instance_id: instanceId,
    name: String(item.name || instanceId),
    type: String(item.type || 'Satellite'),
    node_index: Number.isFinite(item.node_index) ? item.node_index : index % 3,
    start: item.start !== false,
    extra: item.extra || { source: '导入的拓扑配置' },
  }
}

/** 导入拓扑：接受 { instances: [...], links: [...] } 格式，替换当前演示拓扑 */
export function importTopology(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('拓扑配置需要是一个 JSON 对象')
  }
  if (!Array.isArray(payload.instances) || payload.instances.length === 0) {
    throw new Error('拓扑配置需要包含非空的 instances 数组')
  }

  const state = getState()
  const instances = payload.instances.map(normalizeInstance)
  const positions = {}
  instances.forEach((item, index) => {
    // 没有位置数据的节点按球面均分摆放，保证三维视图能看到
    const angle = (index * 37) % 360
    const radius = 0.6 + (index % 5) * 0.05
    positions[item.instance_id] = {
      longitude: (angle * Math.PI) / 180,
      latitude: Math.sin(index * 1.7) * radius,
      altitude: item.type === 'Satellite' ? 550000 : 30,
    }
  })

  const instanceMap = Object.fromEntries(instances.map((item) => [item.instance_id, item]))
  const links = (Array.isArray(payload.links) ? payload.links : []).map((item, index) => {
    const from = String(item.connect_instance?.[0] || item.from || instances[0].instance_id)
    const to = String(item.connect_instance?.[1] || item.to || instances[1]?.instance_id || from)
    return {
      link_id: String(item.link_id || `imported-link-${index + 1}`),
      type: String(item.type || 'Wireless'),
      enable: item.enable !== false,
      connect_instance: [from, to],
      node_index: instanceMap[from]?.node_index ?? 0,
      cross_machine:
        (instanceMap[from]?.node_index ?? 0) !== (instanceMap[to]?.node_index ?? 0),
      parameter: {
        connect: item.parameter?.connect === 0 ? 0 : 1,
        bandwidth: Number(item.parameter?.bandwidth || 1000),
        delay: Number(item.parameter?.delay || 10),
        loss: Number(item.parameter?.loss || 0),
      },
      address_infos: [
        { ip: `10.30.${index + 1}.1`, ipv6: `fd00:30:${index + 1}::1`, mac: `02:10:00:00:${index + 1}:01`, mtu: '1500' },
        { ip: `10.30.${index + 1}.2`, ipv6: `fd00:30:${index + 1}::2`, mac: `02:10:00:00:${index + 1}:02`, mtu: '1500' },
      ],
      extra: { protocol: '导入配置', encryption: 'AES-256' },
    }
  })

  state.instances = instances
  state.links = links
  state.positions = positions
  saveState()
}

function normalizeDir(path) {
  const value = String(path || '').replace(/^\/+/, '')
  return value && !value.endsWith('/') ? `${value}/` : value
}

function entryParent(path) {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : `${path.slice(0, index)}/`
}

function entryName(path) {
  return path.slice(path.lastIndexOf('/') + 1)
}

export function listFiles(path) {
  const dir = normalizeDir(path)
  const state = getState()
  return state.files
    .filter((item) => entryParent(item.path) === dir)
    .map((item) => ({
      name: entryName(item.path),
      size: item.size || 0,
      privilege: item.isDir ? 493 : 420,
      last_modify_time: item.last_modify_time,
      is_dir: Boolean(item.isDir),
    }))
    .sort((a, b) => {
      if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export function readFileContent(path) {
  const state = getState()
  const entry = state.files.find((item) => item.path === path)
  if (!entry || entry.isDir) throw new Error(`文件 ${path || '/'} 不存在`)
  return entry.content || ''
}

export function addFile(dirPath, name, content) {
  const dir = normalizeDir(dirPath)
  const state = getState()
  const path = `${dir}${name}`
  if (state.files.some((item) => item.path === path)) {
    throw new Error(`目录中已存在同名文件：${name}`)
  }
  state.files.push({
    path,
    isDir: false,
    content: String(content ?? ''),
    size: new TextEncoder().encode(String(content ?? '')).length,
    last_modify_time: new Date().toISOString(),
  })
  saveState()
}

export function removeFile(path) {
  const target = String(path || '').replace(/\/+$/, '')
  if (!target) throw new Error('不能删除根目录')
  const state = getState()
  const before = state.files.length
  state.files = state.files.filter(
    (item) => item.path !== target && !item.path.startsWith(`${target}/`),
  )
  if (state.files.length === before) throw new Error(`路径 ${path} 不存在`)
  saveState()
}

export function updateDatabaseItem(key, value) {
  const state = getState()
  state.database[key] = String(value)
  saveState()
}

export function deleteDatabaseItem(key) {
  const state = getState()
  delete state.database[key]
  saveState()
}

export { STORAGE_KEY }
