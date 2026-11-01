// 浏览器内的模拟后端：按真实后端的路径和返回结构处理请求。
// 页面代码不需要区分演示版和真实版，只是把 HTTP 请求换成了这里的函数调用。

import {
  addFile,
  deleteDatabaseItem,
  deleteLink,
  getState,
  importTopology,
  listFiles,
  readFileContent,
  removeFile,
  resetState,
  saveState,
  setRunning,
  startInstance,
  stopInstance,
  updateDatabaseItem,
  updateTypeConfig,
} from './state'
import {
  getLastInstanceResources,
  getLastLinkResources,
  getLastNodeResources,
  getPeriodInstanceData,
  getPeriodLinkData,
  getPeriodNodeData,
} from './metrics'

let terminalSequence = 0

const ok = (data) => ({ code: 0, msg: 'Success', data: data === undefined ? null : data })
const fail = (msg) => ({ code: -1, msg, data: null })

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function splitSegments(url) {
  const [pathname] = String(url || '/').split('?')
  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
}

function parseBody(data) {
  if (data === undefined || data === null || data === '') return {}
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (error) {
      return {}
    }
  }
  return data
}

function stripInternal(instance) {
  const { position, ...rest } = instance
  return rest
}

function buildNodeList(state) {
  return state.machines.map((machine) => ({
    node_index: machine.node_index,
    free_instance: Math.max(
      0,
      machine.capacity - state.instances.filter((item) => item.node_index === machine.node_index).length,
    ),
    is_master_node: machine.is_master_node,
    l_3_addr_v_4: machine.l_3_addr_v_4,
    l_3_addr_v_6: machine.l_3_addr_v_6,
    l_2_addr: machine.l_2_addr,
  }))
}

function buildInstanceDetail(state, instanceId) {
  const instance = state.instances.find((item) => item.instance_id === instanceId)
  if (!instance) return null

  const type = state.typeConfig[instance.type] || {}
  const connections = {}

  state.links
    .filter((link) => link.connect_instance.includes(instanceId))
    .forEach((link) => {
      const peerId =
        link.connect_instance[0] === instanceId
          ? link.connect_instance[1]
          : link.connect_instance[0]
      const peer = state.instances.find((item) => item.instance_id === peerId)
      connections[link.link_id] = {
        link_id: link.link_id,
        instance_id: peerId,
        instance_type: peer?.type || '',
        end_node_index: peer?.node_index ?? 0,
      }
    })

  return {
    ...stripInternal(instance),
    image: type.image || '',
    resource_limit: type.resource_limit || { nano_cpu: 0, memory_byte: 0 },
    connections,
  }
}

function buildLinkDetail(state, linkId) {
  const link = state.links.find((item) => item.link_id === linkId)
  if (!link) return null

  const endInfos = link.connect_instance.map((instanceId) => {
    const instance = state.instances.find((item) => item.instance_id === instanceId)
    return {
      instance_id: instanceId,
      instance_type: instance?.type || '',
      end_node_index: instance?.node_index ?? 0,
    }
  })

  return {
    ...link,
    end_infos: endInfos,
    address_infos: link.address_infos,
    parameter: link.parameter,
    cross_machine: endInfos[0].end_node_index !== endInfos[1].end_node_index,
  }
}

function filterSeries(map, key) {
  if (key === 'all') return map
  if (map && Object.prototype.hasOwnProperty.call(map, key)) {
    return { [key]: map[key] }
  }
  return {}
}

export async function handleMockRequest(config) {
  // 模拟一点网络延迟，页面上的加载状态和刷新按钮才有意义
  await delay(120 + Math.round(Math.random() * 180))

  const method = String(config.method || 'get').toUpperCase()
  const segments = splitSegments(config.url)
  const params = config.params || {}
  const body = parseBody(config.data)
  const state = getState()

  try {
    // 模拟运行控制
    if (method === 'GET' && segments[0] === 'emulation' && segments.length === 1) {
      return ok({ running: state.running, type_config: state.typeConfig })
    }
    if (method === 'POST' && segments[0] === 'emulation') {
      const action = segments[1]
      if (action === 'start') {
        setRunning(true)
        return ok({})
      }
      if (action === 'stop') {
        setRunning(false)
        return ok({})
      }
      if (action === 'reset') {
        resetState()
        // 重置后回到未启动状态，与真实环境一致
        setRunning(false)
        return ok({})
      }
      if (action === 'topology') {
        importTopology(body)
        return ok({})
      }
      if (action === 'update') {
        updateTypeConfig(body)
        return ok({})
      }
      return fail(`未知的模拟运行操作：${action || ''}`)
    }

    // 部署机器
    if (method === 'GET' && segments[0] === 'node' && segments.length === 1) {
      return ok(buildNodeList(state))
    }
    if (method === 'GET' && segments[0] === 'node' && segments.length === 2) {
      const node = buildNodeList(state).find((item) => item.node_index === Number(segments[1]))
      if (!node) return fail(`部署机器 ${segments[1]} 不存在`)
      return ok(node)
    }

    // 网络节点
    if (method === 'GET' && segments[0] === 'instance' && segments.length === 1) {
      return ok(state.instances.map(stripInternal))
    }
    if (method === 'POST' && segments[0] === 'instance' && segments[1] === 'start') {
      startInstance(body.node_index, body.instance_id)
      return ok({})
    }
    if (method === 'POST' && segments[0] === 'instance' && segments[1] === 'stop') {
      stopInstance(body.node_index, body.instance_id)
      return ok({})
    }
    if (method === 'GET' && segments[0] === 'instance' && segments.length === 3) {
      const detail = buildInstanceDetail(state, segments[2])
      if (!detail) return fail(`节点 ${segments[2]} 不存在`)
      return ok(detail)
    }

    // 链路
    if (method === 'GET' && segments[0] === 'link' && segments.length === 1) {
      return ok(
        state.links.map((link) => ({
          link_id: link.link_id,
          type: link.type,
          enable: link.enable,
          connect_instance: link.connect_instance,
          node_index: link.node_index,
        })),
      )
    }
    if (method === 'DELETE' && segments[0] === 'link' && segments.length === 2) {
      deleteLink(segments[1])
      return ok({})
    }
    if (method === 'GET' && segments[0] === 'link' && segments.length === 3) {
      const detail = buildLinkDetail(state, segments[2])
      if (!detail) return fail(`链路 ${segments[2]} 不存在`)
      return ok(detail)
    }

    // 链路参数
    if (method === 'GET' && segments[0] === 'link_parameter' && segments.length === 1) {
      const result = {}
      state.links.forEach((link) => {
        result[link.link_id] = link.parameter
      })
      return ok(result)
    }
    if (method === 'GET' && segments[0] === 'link_parameter' && segments.length === 3) {
      const link = state.links.find((item) => item.link_id === segments[2])
      if (!link) return fail(`链路 ${segments[2]} 不存在`)
      return ok(link.parameter)
    }

    // 节点位置
    if (method === 'GET' && segments[0] === 'position' && segments[1] === 'all') {
      return ok(state.positions)
    }

    // 最新资源
    if (method === 'GET' && segments[0] === 'resource' && segments[1] === 'last') {
      const kind = segments[2]
      const key = segments[3] || 'all'
      if (kind === 'node') return ok(getLastNodeResources(key))
      if (kind === 'link') return ok(getLastLinkResources(key))
      if (kind === 'instance') return ok(getLastInstanceResources(key))
      return fail(`未知的资源类型：${kind}`)
    }

    // 周期资源
    if (method === 'GET' && segments[0] === 'resource' && segments[1] === 'period') {
      const kind = segments[2]
      const key = segments[3]
      const period = params.period || '10m'
      if (kind === 'node') return ok(filterSeries(getPeriodNodeData(key, period), key))
      if (kind === 'instance') return ok(filterSeries(getPeriodInstanceData(key, period), key))
      if (kind === 'link') return ok(filterSeries(getPeriodLinkData(key, period), key))
      return fail(`未知的资源类型：${kind}`)
    }

    // 文件
    if (method === 'GET' && segments[0] === 'file' && segments[1] === 'list') {
      return ok(listFiles(params.path || ''))
    }
    if (method === 'GET' && segments[0] === 'file' && segments[1] === 'preview') {
      return ok(readFileContent(params.path || ''))
    }
    if (method === 'POST' && segments[0] === 'file' && segments.length === 1) {
      if (typeof FormData === 'undefined' || !(body instanceof FormData)) {
        return fail('上传内容不是文件')
      }
      const file = body.get('file')
      if (!file) return fail('上传内容缺少 file 字段')
      const content = await file.text()
      addFile(params.path || '', file.name, content)
      return ok({})
    }
    if (method === 'DELETE' && segments[0] === 'file' && segments.length === 1) {
      removeFile(params.path || '')
      return ok({})
    }

    // 数据库
    if (method === 'GET' && segments[0] === 'database' && segments[1] === 'items') {
      return ok(state.database)
    }
    if (method === 'POST' && segments[0] === 'database' && segments[1] === 'update') {
      if (!body.key) return fail('缺少数据库键名')
      updateDatabaseItem(body.key, body.item)
      return ok({})
    }
    if (method === 'POST' && segments[0] === 'database' && segments[1] === 'delete') {
      if (!body.key) return fail('缺少数据库键名')
      deleteDatabaseItem(body.key)
      return ok({})
    }

    // 终端（演示版返回内置的模拟终端页面）
    if (method === 'POST' && segments[0] === 'webshell' && segments[1] === 'instance') {
      terminalSequence += 1
      const target = state.instances.find((item) => item.instance_id === body.instance_id)
      return ok({
        url: `mock-terminal.html?kind=instance&id=${encodeURIComponent(
          body.instance_id || '',
        )}&name=${encodeURIComponent(target?.name || target?.instance_id || '演示节点')}&session=${terminalSequence}`,
      })
    }
    if (method === 'POST' && segments[0] === 'webshell' && segments[1] === 'link') {
      terminalSequence += 1
      return ok({
        url: `mock-terminal.html?kind=link&id=${encodeURIComponent(
          body.link_id || '',
        )}&session=${terminalSequence}`,
      })
    }

    return fail(`演示环境没有实现这个接口：${method} ${config.url}`)
  } catch (error) {
    return fail(error?.message || '演示数据操作失败')
  }
}

// 供页面直接读取初始位置等信息（不经过接口）
export function readMockFileContent(path) {
  return readFileContent(path)
}

export { saveState }
