import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, App, Button, Empty, Popconfirm, Spin, Tree } from 'antd'
import { DeleteOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'
import JsonEditor from '@/components/common/JsonEditor'
import { databaseApi } from '@/api'

/** 把 { '/a/b/c': '...' } 这样的键值表拆成 antd Tree 需要的数据 */
function buildKeyTree(items) {
  const root = new Map()

  Object.keys(items).forEach((key) => {
    const segments = String(key).split('/').filter(Boolean)
    if (!segments.length) return
    let level = root
    segments.forEach((segment, index) => {
      if (!level.has(segment)) {
        level.set(segment, { name: segment, children: new Map(), entryPath: null })
      }
      const node = level.get(segment)
      if (index === segments.length - 1) node.entryPath = key
      level = node.children
    })
  })

  const directoryKeys = []
  const entryPathMap = {}

  const convert = (level, parentPath) => {
    const nodes = []
    level.forEach((node) => {
      const nodeKey = `${parentPath}/${node.name}`
      const children = convert(node.children, nodeKey)
      if (children.length) directoryKeys.push(nodeKey)
      if (node.entryPath !== null) entryPathMap[nodeKey] = node.entryPath
      const treeNode = { key: nodeKey, title: node.name }
      if (children.length) treeNode.children = children
      nodes.push(treeNode)
    })
    return nodes
  }

  return { treeData: convert(root, ''), directoryKeys, entryPathMap }
}

export default function DatabaseViewer() {
  const { message } = App.useApp()
  const editorContentRef = useRef(null)
  const entryPathMapRef = useRef({})

  const [items, setItems] = useState({})
  const [treeData, setTreeData] = useState([])
  const [expandedKeys, setExpandedKeys] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])
  const [selectedEntryKey, setSelectedEntryKey] = useState('')
  const [editorValue, setEditorValue] = useState(null)
  const [isTextEntry, setIsTextEntry] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await databaseApi.items()
      const data =
        res?.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : {}
      setItems(data)
      const { treeData: nextTreeData, directoryKeys, entryPathMap } = buildKeyTree(data)
      entryPathMapRef.current = entryPathMap
      setTreeData(nextTreeData)
      setExpandedKeys((prev) => Array.from(new Set([...prev, ...directoryKeys])))
    } catch (err) {
      message.error(err.message || '读取数据库条目失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    loadItems()
    // 只在页面挂载时读取一次键列表
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = (keys) => {
    const entryKey = entryPathMapRef.current[keys[0] || ''] || ''
    setSelectedKeys(keys)
    setSelectedEntryKey(entryKey)
    editorContentRef.current = null

    if (!entryKey || items[entryKey] === undefined) {
      setEditorValue(null)
      setIsTextEntry(false)
      return
    }

    const raw = items[entryKey]
    try {
      setEditorValue(JSON.parse(raw))
      setIsTextEntry(false)
    } catch {
      // 不合法 JSON：只按文本展示，不再交给 JsonEditor，避免把包装对象存回后端
      setEditorValue(typeof raw === 'string' ? raw : String(raw))
      setIsTextEntry(true)
    }
  }

  const handleEditorChange = (content) => {
    editorContentRef.current = content
  }

  const handleSave = async () => {
    if (!selectedEntryKey) return
    if (isTextEntry) {
      message.warning('该条目不是合法 JSON，只能查看文本，不能在这里保存')
      return
    }
    const content = editorContentRef.current
    let payload = editorValue
    if (content) {
      if (content.json !== undefined) {
        payload = content.json
      } else if (typeof content.text === 'string') {
        try {
          payload = JSON.parse(content.text)
        } catch {
          message.error('内容不是合法 JSON，无法保存')
          return
        }
      } else {
        payload = undefined
      }
    }
    if (payload === undefined) {
      message.error('没有可保存的内容')
      return
    }

    setSaving(true)
    try {
      await databaseApi.update(selectedEntryKey, JSON.stringify(payload))
      message.success('条目已保存')
      editorContentRef.current = null
      setEditorValue(payload)
      setIsTextEntry(false)
      await loadItems()
    } catch (err) {
      message.error(err.message || '保存条目失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEntryKey) return
    setDeleting(true)
    try {
      await databaseApi.remove(selectedEntryKey)
      message.success('条目已删除')
      editorContentRef.current = null
      setSelectedKeys([])
      setSelectedEntryKey('')
      setEditorValue(null)
      setIsTextEntry(false)
      await loadItems()
    } catch (err) {
      message.error(err.message || '删除条目失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageContainer
      title="数据库查看"
      description="查看后端键值数据库中的条目，键按 / 分层展示，值以 JSON 文本保存"
    >
      <div className="split-2">
        <GlassCard
          title="键列表"
          extra={
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={loadItems}
            >
              刷新
            </Button>
          }
          style={{ minWidth: 300 }}
        >
          <Spin spinning={loading}>
            {treeData.length > 0 ? (
              <Tree
                blockNode
                showLine={{ showLeafIcon: false }}
                treeData={treeData}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                onExpand={(keys) => setExpandedKeys(keys)}
                onSelect={handleSelect}
                style={{ maxHeight: 540, overflowY: 'auto' }}
              />
            ) : (
              <Empty
                description={loading ? '正在读取键列表…' : '数据库暂无条目'}
                style={{ padding: '48px 0' }}
              />
            )}
          </Spin>
          <div className="text-subtle" style={{ marginTop: 10, fontSize: 'var(--fs-xs)' }}>
            键按 / 分层显示，点击节点查看对应条目；只有末级节点一般有内容。
          </div>
        </GlassCard>

        <GlassCard
          title="条目内容"
          extra={<span className="detail-value">{selectedEntryKey || '未选择条目'}</span>}
        >
          {selectedEntryKey ? (
            isTextEntry ? (
              <div className="stack">
                <Alert type="warning" showIcon message="该条目不是合法 JSON，只能查看文本" />
                <pre
                  style={{
                    minHeight: 360,
                    maxHeight: 540,
                    overflow: 'auto',
                    margin: 0,
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--log-bg)',
                    color: 'var(--log-fg)',
                    fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
                    fontSize: 'var(--fs-sm)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {editorValue ?? ''}
                </pre>
                <div className="toolbar">
                  <Popconfirm
                    title="确定删除该条目？"
                    description="删除后无法恢复"
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleDelete}
                  >
                    <Button danger icon={<DeleteOutlined />} loading={deleting}>
                      删除
                    </Button>
                  </Popconfirm>
                  <span className="text-subtle" style={{ marginLeft: 'auto' }}>
                    该条目只能查看和删除，需要先在别处修正为合法 JSON 才能保存
                  </span>
                </div>
              </div>
            ) : (
              <div className="stack">
                <JsonEditor value={editorValue} onChange={handleEditorChange} height={400} />
                <div className="toolbar">
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSave}
                  >
                    保存
                  </Button>
                  <Popconfirm
                    title="确定删除该条目？"
                    description="删除后无法恢复"
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleDelete}
                  >
                    <Button danger icon={<DeleteOutlined />} loading={deleting}>
                      删除
                    </Button>
                  </Popconfirm>
                  <span className="text-subtle" style={{ marginLeft: 'auto' }}>
                    保存会用编辑器内容整体覆盖该条目
                  </span>
                </div>
              </div>
            )
          ) : (
            <Empty
              description={
                selectedKeys.length > 0
                  ? '该路径只是分组，没有对应条目'
                  : '从左侧选择一个条目查看或编辑'
              }
              style={{ padding: '72px 0' }}
            />
          )}
        </GlassCard>
      </div>
    </PageContainer>
  )
}
