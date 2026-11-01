import { Drawer } from 'antd'

export default function DrawerHost({ open, config, onClose }) {
  const { title, content, footer, extra, width, placement, className } = config

  return (
    <Drawer
      open={open}
      title={title}
      width={width}
      placement={placement}
      onClose={onClose}
      footer={footer}
      extra={extra}
      className={className}
      maskClosable
      destroyOnClose
      styles={{ body: { padding: '20px 22px' } }}
    >
      {content}
    </Drawer>
  )
}
