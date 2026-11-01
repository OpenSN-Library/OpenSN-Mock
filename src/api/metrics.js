import client from './client'

// 资源监控接口。node_index / link_id / instance_id 传 all 表示查询全部。
export const metricsApi = {
  lastNode: (nodeIndex = 'all') => client.get(`/resource/last/node/${nodeIndex}`),
  lastLink: (linkId = 'all') => client.get(`/resource/last/link/${linkId}`),
  lastInstance: (instanceId = 'all') => client.get(`/resource/last/instance/${instanceId}`),
  periodNode: (nodeIndex, period) =>
    client.get(`/resource/period/node/${nodeIndex}`, { params: { period } }),
  periodInstance: (instanceId, period) =>
    client.get(`/resource/period/instance/${encodeURIComponent(instanceId)}`, {
      params: { period },
    }),
  periodLink: (linkId, period) =>
    client.get(`/resource/period/link/${encodeURIComponent(linkId)}`, { params: { period } }),
}
