import client from './client'

export const instanceApi = {
  list: () => client.get('/instance/'),
  detail: (nodeIndex, instanceId) =>
    client.get(`/instance/${nodeIndex}/${encodeURIComponent(instanceId)}`),
  start: (nodeIndex, instanceId) =>
    client.post('/instance/start', { node_index: Number(nodeIndex), instance_id: instanceId }),
  stop: (nodeIndex, instanceId) =>
    client.post('/instance/stop', { node_index: Number(nodeIndex), instance_id: instanceId }),
}
