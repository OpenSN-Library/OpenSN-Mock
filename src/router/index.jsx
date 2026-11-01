import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/nodes" element={<Navigate to="/nodes/instances" replace />} />
      <Route path="/links" element={<Navigate to="/links/list" replace />} />
      <Route path="/help" element={<Navigate to="/help/manual" replace />} />
      <Route path="*" element={<AppLayout />} />
    </Routes>
  )
}
