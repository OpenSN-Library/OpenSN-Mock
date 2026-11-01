import client from './client'

export const webshellApi = {
  startInstance: (nodeIndex, instanceId, expireMinute = 5) =>
    client.post('/webshell/instance', {
      node_index: Number(nodeIndex),
      instance_id: instanceId,
      expire_minute: expireMinute,
    }),
  startLink: (linkId, nodeIndex, expireMinute = 5) =>
    client.post('/webshell/link', {
      link_id: linkId,
      node_index: Number(nodeIndex),
      expire_minute: expireMinute,
    }),
}
