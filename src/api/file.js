import client from './client'
import { readMockFileContent } from './mock/server'

export const fileApi = {
  list: (path = '') => client.get('/file/list', { params: { path } }),
  preview: (path) => client.get('/file/preview', { params: { path } }),
  upload: (file, path = '') => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/file/', formData, { params: { path } })
  },
  remove: (path) => client.delete('/file/', { params: { path } }),
  // 演示版没有后端下载接口，直接把文件内容转成 data URL 交给浏览器下载
  downloadUrl: (path = '') => {
    const content = readMockFileContent(path)
    return `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`
  },
}
