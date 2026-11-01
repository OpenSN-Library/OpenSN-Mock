import axios from 'axios'

// 后端与前端同源部署，接口统一挂在 /api 下；开发时由 vite 代理到本机 8080 端口
const client = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// 后端统一返回 { code, msg, data }，这里直接把 data 交给调用方
client.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'code' in body && body.code !== 0) {
      return Promise.reject(new Error(body.msg || '请求失败'))
    }
    return body
  },
  (error) => {
    const body = error?.response?.data
    const message = body?.msg || body?.message || error?.message || '网络请求失败'
    return Promise.reject(new Error(message))
  },
)

export default client
