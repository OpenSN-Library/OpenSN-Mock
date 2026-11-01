import client from './client'

export const fileApi = {
  list: (path = '') => client.get('/file/list', { params: { path } }),
  preview: (path) => client.get('/file/preview', { params: { path } }),
  upload: (file, path = '') => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/file/', formData, { params: { path } })
  },
  remove: (path) => client.delete('/file/', { params: { path } }),
  downloadUrl: (path = '') => {
    const fileName = path.split('/').pop() || ''
    return `/api/file/download/${encodeURIComponent(fileName)}?path=${encodeURIComponent(path)}`
  },
}
