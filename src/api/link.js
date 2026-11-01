import client from './client'

export const linkApi = {
  list: () => client.get('/link/'),
  detail: (nodeIndex, linkId) => client.get(`/link/${nodeIndex}/${encodeURIComponent(linkId)}`),
  remove: (linkId) => client.delete(`/link/${encodeURIComponent(linkId)}`),
  parameterList: () => client.get('/link_parameter/'),
  parameter: (nodeIndex, linkId) =>
    client.get(`/link_parameter/${nodeIndex}/${encodeURIComponent(linkId)}`),
}
