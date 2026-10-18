import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../auth'

// Protege rutas del lado del cliente. El backend ya exige auth en la API;
// esto además evita mostrar páginas a usuarios sin sesión o sin el rol.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="text-center text-muted py-5">Cargando…</div>
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
