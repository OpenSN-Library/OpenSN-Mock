import client from './client'

export const nodeApi = {
  list: () => client.get('/node/'),
  detail: (nodeIndex) => client.get(`/node/${nodeIndex}`),
}
