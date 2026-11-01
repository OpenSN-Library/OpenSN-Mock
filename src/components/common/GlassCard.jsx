export default function GlassCard({
  title,
  extra,
  children,
  className = '',
  style,
  bodyStyle,
  bodyClassName = '',
  onClick,
  noPadding = false,
}) {
  const classes = ['glass-card', noPadding ? 'no-pad' : '', className].filter(Boolean).join(' ')

  return (
    <div className={classes} style={style} onClick={onClick}>
      {(title || extra) && (
        <div className="glass-card-header">
          <span className="glass-card-title">{title}</span>
          {extra && <span className="glass-card-extra">{extra}</span>}
        </div>
      )}
      <div className={`glass-card-body ${bodyClassName}`} style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}
