import GlassCard from './GlassCard'

export default function StatCard({ title, value, description, icon, color = '#5e6ad2' }) {
  return (
    <GlassCard className="stat-card">
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {description && <div className="stat-desc">{description}</div>}
      </div>
    </GlassCard>
  )
}
