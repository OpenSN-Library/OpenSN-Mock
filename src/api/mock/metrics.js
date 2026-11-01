// 演示版资源数据：不访问数据库，按时间生成有起伏的曲线。
// 同一台机器、同一条链路的曲线是连续的，所以页面轮询刷新时数字会缓慢变化。

import { getState } from './state'

const PERIOD_TABLE = {
  '1m': { points: 30, stepMs: 2000 },
  '5m': { points: 30, stepMs: 10000 },
  '10m': { points: 40, stepMs: 15000 },
  '30m': { points: 30, stepMs: 60000 },
  '1h': { points: 30, stepMs: 120000 },
  '3h': { points: 36, stepMs: 300000 },
  '6h': { points: 36, stepMs: 600000 },
  '12h': { points: 36, stepMs: 1200000 },
  '24h': { points: 36, stepMs: 2400000 },
}

function hashString(text) {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return hash % 1000
}

function noise(seed, seconds) {
  return (
    Math.sin(seconds * 0.51 + seed) * 0.6 +
    Math.sin(seconds * 0.13 + seed * 2.7) * 0.25 +
    Math.sin(seconds * 1.73 + seed * 0.7) * 0.15
  )
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function ratio(seed, seconds, floor = 0.18, ceil = 0.86) {
  const base = 0.5 + noise(seed, seconds) * 0.38
  return Number(clamp(base, floor, ceil).toFixed(4))
}

function nowSeconds() {
  return Date.now() / 1000
}

function periodSpec(period) {
  return PERIOD_TABLE[period] || PERIOD_TABLE['10m']
}

function instancedSeed(prefix, id) {
  return hashString(`${prefix}:${id}`)
}

function nodeRecord(machine, seconds) {
  const seed = instancedSeed('node', machine.node_index)
  const cpu = ratio(seed, seconds, 0.22, 0.92)
  const memoryLimit = 32 * 1024 * 1024 * 1024
  const memory = memoryLimit * (0.28 + cpu * 0.36 + (noise(seed + 11, seconds) + 1) * 0.03)
  return {
    Time: new Date(seconds * 1000).toISOString(),
    cpu_usage: cpu,
    mem_byte: Math.round(memory),
    swap_mem_byte: Math.round(memoryLimit * 0.06 * clamp(0.4 + cpu, 0.2, 1.6)),
  }
}

function instanceRecord(instance, seconds) {
  const seed = instancedSeed('instance', instance.instance_id)
  const typeConfig = getState().typeConfig[instance.type] || {}
  const memoryLimit = Number(typeConfig.resource_limit?.memory_byte || 64 * 1024 * 1024)

  if (!instance.start) {
    return {
      Time: new Date(seconds * 1000).toISOString(),
      cpu_usage: 0,
      mem_byte: 0,
      swap_mem_byte: 0,
    }
  }

  const cpu = ratio(seed, seconds, 0.05, 0.72)
  return {
    Time: new Date(seconds * 1000).toISOString(),
    cpu_usage: cpu,
    mem_byte: Math.round(memoryLimit * (0.25 + cpu * 0.55)),
    swap_mem_byte: Math.round(memoryLimit * 0.05 * clamp(cpu * 2, 0.2, 1.5)),
  }
}

function linkRecord(link, seconds) {
  const seed = instancedSeed('link', link.link_id)
  const timeLabel = new Date(seconds * 1000).toISOString()

  if (!link.enable || link.parameter?.connect !== 1) {
    return {
      Time: timeLabel,
      send_bps: 0,
      recv_bps: 0,
      send_pps: 0,
      recv_pps: 0,
      send_drop_pps: 0,
      recv_drop_pps: 0,
      send_err_pps: 0,
      recv_err_pps: 0,
    }
  }

  const wired = link.type === 'Wired'
  const baseBps = wired ? 8_000_000 : 900_000
  const wave = 0.55 + Math.abs(noise(seed, seconds)) * 0.75
  const sendBps = baseBps * wave
  const recvBps = baseBps * (0.5 + Math.abs(noise(seed + 5, seconds)) * 0.85)
  const packetSize = wired ? 1400 : 900
  const sendPps = sendBps / packetSize / 8
  const recvPps = recvBps / packetSize / 8
  const lossRatio = Number(link.parameter?.loss || 0) / 100

  return {
    Time: timeLabel,
    send_bps: Math.round(sendBps),
    recv_bps: Math.round(recvBps),
    send_pps: Math.round(sendPps),
    recv_pps: Math.round(recvPps),
    send_drop_pps: Math.round(sendPps * lossRatio),
    recv_drop_pps: Math.round(recvPps * lossRatio * 1.2),
    send_err_pps: Math.round(sendPps * 0.0004),
    recv_err_pps: Math.round(recvPps * 0.0005),
  }
}

export function getLastNodeResources(nodeIndex = 'all') {
  const state = getState()
  const seconds = nowSeconds()
  const machines =
    nodeIndex === 'all'
      ? state.machines
      : state.machines.filter((item) => item.node_index === Number(nodeIndex))
  return machines.map((machine) => nodeRecord(machine, seconds))
}

export function getLastLinkResources(linkId = 'all') {
  const state = getState()
  const seconds = nowSeconds()
  const links =
    linkId === 'all'
      ? state.links
      : state.links.filter((item) => item.link_id === linkId)
  const result = {}
  links.forEach((link) => {
    const record = linkRecord(link, seconds)
    result[link.link_id] = {
      send_bps: record.send_bps,
      recv_bps: record.recv_bps,
      send_pps: record.send_pps,
      recv_pps: record.recv_pps,
      send_drop_pps: record.send_drop_pps,
      recv_drop_pps: record.recv_drop_pps,
      send_err_pps: record.send_err_pps,
      recv_err_pps: record.recv_err_pps,
    }
  })
  return result
}

export function getLastInstanceResources(instanceId = 'all') {
  const state = getState()
  const seconds = nowSeconds()
  const instances =
    instanceId === 'all'
      ? state.instances
      : state.instances.filter((item) => item.instance_id === instanceId)
  const result = {}
  instances.forEach((instance) => {
    const record = instanceRecord(instance, seconds)
    result[instance.instance_id] = {
      cpu_usage: record.cpu_usage,
      mem_byte: record.mem_byte,
      swap_mem_byte: record.swap_mem_byte,
    }
  })
  return result
}

function buildSeries(period, recordBuilder) {
  const { points, stepMs } = periodSpec(period)
  const now = Date.now()
  const records = []
  for (let i = 0; i < points; i += 1) {
    const time = now - (points - 1 - i) * stepMs
    records.push(recordBuilder(time / 1000))
  }
  return records
}

export function getPeriodInstanceData(instanceId, period) {
  const state = getState()
  const target =
    state.instances.find((item) => item.instance_id === instanceId) || state.instances[0]
  if (!target) return {}
  return {
    [instanceId]: buildSeries(period, (seconds) => instanceRecord(target, seconds)),
  }
}

export function getPeriodNodeData(nodeIndex, period) {
  const state = getState()
  const target =
    state.machines.find((item) => item.node_index === Number(nodeIndex)) || state.machines[0]
  if (!target) return {}
  return {
    [nodeIndex]: buildSeries(period, (seconds) => nodeRecord(target, seconds)),
  }
}

export function getPeriodLinkData(linkId, period) {
  const state = getState()
  const target =
    state.links.find((item) => item.link_id === linkId) || state.links[0]
  if (!target) return {}
  return {
    [linkId]: buildSeries(period, (seconds) => linkRecord(target, seconds)),
  }
}
