import client from './client'

export const positionApi = {
  list: () => client.get('/position/all'),
}
