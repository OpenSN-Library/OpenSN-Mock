export default function PageContainer({ title, description, actions, children }) {
  return (
    <div className="page-container fade-in-up">
      {(title || actions) && (
        <div className="page-header">
          <div>
            {title && <div className="page-title">{title}</div>}
            {description && <div className="page-desc">{description}</div>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
