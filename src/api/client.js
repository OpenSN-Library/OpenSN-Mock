import axios from 'axios'
import { handleMockRequest } from './mock/server'

// 演示版没有后端：所有请求都由浏览器内的模拟接口处理。
// 页面里的接口调用方式与真实版完全一致，只是不再发出网络请求。
const client = axios.create({
  baseURL: '/api',
  timeout: 20000,
  adapter: async (config) => {
    const body = await handleMockRequest(config)
    return {
      data: body,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    }
  },
})

// 统一处理 { code, msg, data } 返回结构，与真实版保持一致
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
    const message = body?.msg || body?.message || error?.message || '演示数据请求失败'
    return Promise.reject(new Error(message))
  },
)

export default client
