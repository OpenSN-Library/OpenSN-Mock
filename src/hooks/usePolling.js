import { useEffect, useRef } from 'react'

/**
 * 周期性执行数据加载函数。上一个请求结束后才安排下一次，避免请求堆积。
 */
export function usePolling(callback, interval = 8000, { immediate = true } = {}) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let timer = null
    let stopped = false

    const tick = async () => {
      if (stopped) return
      try {
        await callbackRef.current()
      } catch (err) {
        /* 轮询失败不打断后续轮询 */
      } finally {
        if (!stopped) timer = setTimeout(tick, interval)
      }
    }

    if (immediate) {
      tick()
    } else {
      timer = setTimeout(tick, interval)
    }

    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }, [interval, immediate])
}
