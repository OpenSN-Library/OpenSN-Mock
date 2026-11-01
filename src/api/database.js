import client from './client'

export const databaseApi = {
  items: () => client.get('/database/items'),
  // 后端字段名为 item，值为 JSON 字符串
  update: (key, value) => client.post('/database/update', { key, item: value }),
  remove: (key) => client.post('/database/delete', { key }),
}
