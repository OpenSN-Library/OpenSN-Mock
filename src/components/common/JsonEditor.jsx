import { useEffect, useRef } from 'react'
import { JSONEditor } from 'vanilla-jsoneditor'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import '@/styles/json-editor.css'

/**
 * JSON 查看与编辑组件。
 * - value 变化时会把内容重新载入编辑器（用于切换数据条目）
 * - 用户编辑过程中的内容通过 onChange(content) 回传，content 形如 { json } 或 { text }
 */
export default function JsonEditor({ value, onChange, height = 420, readOnly = false }) {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const editor = new JSONEditor({
      target: containerRef.current,
      props: {
        content: { json: value ?? {} },
        readOnly,
        mode: 'tree',
        mainMenuBar: false,
        navigationBar: false,
        onChange: (content) => onChangeRef.current?.(content),
      },
    })
    editorRef.current = editor

    return () => {
      editor.destroy()
      editorRef.current = null
    }
    // 只在挂载时创建编辑器；value 的后续变化通过 updateProps 同步
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    editorRef.current?.updateProps({
      content: { json: value ?? {} },
      readOnly,
      onChange: (content) => onChangeRef.current?.(content),
    })
  }, [value, readOnly])

  return (
    <div className="json-editor jse-theme-dark" style={{ height }}>
      <div ref={containerRef} style={{ height: '100%' }} />
    </div>
  )
}
