import { useCallback, useEffect, useRef, useState } from 'react'
import { App, Button, Popconfirm, Tree } from 'antd'
import {
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import PageContainer from '@/components/common/PageContainer'
import GlassCard from '@/components/common/GlassCard'
import { fileApi } from '@/api'
import { formatBytes } from '@/utils/format'

const ROOT_KEY = ''
const ROOT_NODE = { key: ROOT_KEY, title: '根目录', isLeaf: false }

/** 把某个目录节点的 children 替换成最新一次请求的结果 */
function updateTreeData(nodes, key, children) {
  return nodes.map((node) => {
    if (node.key === key) return { ...node, children }
    if (node.children) {
      return { ...node, children: updateTreeData(node.children, key, children) }
    }
    return node
  })
}

function toTreeNode(parentKey, item) {
  const isDir = Boolean(item.is_dir)
  return {
    key: `${parentKey}${item.name}${isDir ? '/' : ''}`,
    title: (
      <span>
        {item.name}
        {isDir ? '/' : ''}
        {!isDir && (
          <span className="text-subtle" style={{ marginLeft: 8 }}>
            {formatBytes(item.size)}
          </span>
        )}
      </span>
    ),
    isLeaf: !isDir,
  }
}

function parentPath(filePath) {
  const index = filePath.lastIndexOf('/')
  return index < 0 ? '' : filePath.slice(0, index + 1)
}

function displayPath(path) {
  return path || '/'
}

export default function FileManager() {
  const { message } = App.useApp()
  const fileInputRef = useRef(null)
  const loadedDirsRef = useRef(new Set())
  const previewSeqRef = useRef(0)

  const [treeData, setTreeData] = useState(() => [{ ...ROOT_NODE }])
  const [expandedKeys, setExpandedKeys] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const selectedKey = selectedKeys[0] || ROOT_KEY
  const selectedIsFile = Boolean(selectedKey) && !selectedKey.endsWith('/')
  // 上传目标：选中文件夹时是该文件夹，选中文件时是文件所在目录
  const currentDir = selectedIsFile ? parentPath(selectedKey) : selectedKey

  const loadDirectory = useCallback(
    async (path, force = false) => {
      if (!force && loadedDirsRef.current.has(path)) return true
      loadedDirsRef.current.add(path)
      try {
        const res = await fileApi.list(path)
        const items = Array.isArray(res?.data) ? res.data : []
        setTreeData((prev) => updateTreeData(prev, path, items.map((item) => toTreeNode(path, item))))
        return true
      } catch (err) {
        loadedDirsRef.current.delete(path)
        setTreeData((prev) => updateTreeData(prev, path, []))
        message.error(err.message || '读取目录失败')
        return false
      }
    },
    [message],
  )

  const loadRoot = useCallback(async () => {
    loadedDirsRef.current.clear()
    previewSeqRef.current += 1
    setTreeData([{ ...ROOT_NODE }])
    setExpandedKeys([ROOT_KEY])
    setSelectedKeys([])
    setPreview(null)
    setPreviewLoading(false)
    return loadDirectory(ROOT_KEY)
  }, [loadDirectory])

  useEffect(() => {
    loadRoot()
    // 只在页面挂载时读取一次根目录
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const ok = await loadRoot()
      if (ok) message.success('文件列表已刷新')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSelect = async (keys) => {
    setSelectedKeys(keys)
    const path = keys[0] || ROOT_KEY
    if (!path || path.endsWith('/')) {
      setPreview(null)
      setPreviewLoading(false)
      return
    }

    const seq = previewSeqRef.current + 1
    previewSeqRef.current = seq
    setPreview(null)
    setPreviewLoading(true)
    try {
      const res = await fileApi.preview(path)
      if (previewSeqRef.current !== seq) return
      const content = typeof res?.data === 'string' ? res.data : String(res?.data ?? '')
      setPreview({ path, content })
    } catch (err) {
      if (previewSeqRef.current === seq) {
        setPreview(null)
        message.error(err.message || '读取文件内容失败')
      }
    } finally {
      if (previewSeqRef.current === seq) setPreviewLoading(false)
    }
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    try {
      await fileApi.upload(file, currentDir)
      message.success(`已上传 ${file.name} 到 ${displayPath(currentDir)}`)
      await loadDirectory(currentDir, true)
      setExpandedKeys((prev) => (prev.includes(currentDir) ? prev : [...prev, currentDir]))
    } catch (err) {
      message.error(err.message || '上传文件失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = () => {
    if (!selectedIsFile) return
    const link = document.createElement('a')
    link.href = fileApi.downloadUrl(selectedKey)
    link.download = selectedKey.split('/').pop() || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()
    message.success('已开始下载')
  }

  const handleDelete = async () => {
    if (!selectedIsFile) return
    const path = selectedKey
    const dir = parentPath(path)
    setDeleting(true)
    try {
      await fileApi.remove(path)
      message.success(`已删除 ${path}`)
      previewSeqRef.current += 1
      setSelectedKeys([])
      setPreview(null)
      setPreviewLoading(false)
      await loadDirectory(dir, true)
    } catch (err) {
      message.error(err.message || '删除文件失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageContainer
      title="文件管理"
      description="浏览后端工作目录，上传、预览、下载和删除文件；目录内容在展开时才读取"
    >
      <div className="split-2">
        <GlassCard
          title="文件列表"
          extra={<span className="text-subtle">当前目录：{displayPath(currentDir)}</span>}
          style={{ minWidth: 300 }}
        >
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={handleUploadClick}
            >
              上传
            </Button>
            <Button icon={<ReloadOutlined />} loading={refreshing} onClick={handleRefresh}>
              刷新
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Tree
            blockNode
            showLine={{ showLeafIcon: false }}
            treeData={treeData}
            loadData={(node) => loadDirectory(node.key)}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            onExpand={(keys) => setExpandedKeys(keys)}
            onSelect={handleSelect}
            style={{ maxHeight: 540, overflowY: 'auto' }}
          />
          <div className="text-subtle" style={{ marginTop: 10, fontSize: 'var(--fs-xs)' }}>
            上传目标为当前目录；选中文件时，当前目录是文件所在目录。
          </div>
        </GlassCard>

        <GlassCard
          title="文件预览"
          extra={<span className="detail-value">{selectedIsFile ? selectedKey : '未选择文件'}</span>}
        >
          <div
            style={{
              minHeight: 360,
              maxHeight: 540,
              overflow: 'auto',
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
            {preview
              ? preview.content || '（空文件）'
              : previewLoading
                ? '正在读取文件…'
                : '在左侧选择一个文本文件，这里会显示它的内容。'}
          </div>

          <div className="toolbar" style={{ marginTop: 14 }}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              disabled={!selectedIsFile}
              onClick={handleDownload}
            >
              下载
            </Button>
            <Popconfirm
              title="确定删除该文件？"
              description="删除后无法恢复"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              disabled={!selectedIsFile}
              onConfirm={handleDelete}
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting} disabled={!selectedIsFile}>
                删除
              </Button>
            </Popconfirm>
            <span className="text-subtle" style={{ marginLeft: 'auto' }}>
              仅支持预览文本文件
            </span>
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  )
}
