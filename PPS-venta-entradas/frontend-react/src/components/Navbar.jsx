import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth'
import { canManage, ROLE_LABELS } from '../utils'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          🎟️ Entradas
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Alternar navegación"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Eventos
              </NavLink>
            </li>
            {canManage(user) && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">
                  {user.role === 'admin' ? 'Panel Admin' : 'Panel Gestión'}
                </NavLink>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/my-tickets">
                  Mis Entradas
                </NavLink>
              </li>
            )}
            {!user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    Iniciar sesión
                  </NavLink>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-sm btn-warning fw-semibold ms-lg-2 rounded-pill px-3" to="/register">
                    Crear cuenta
                  </Link>
                </li>
              </>
            )}
            {user && (
              <>
                <li className="nav-item">
                  <span className="navbar-text text-white-50 small ms-lg-2">
                    👤 {user.full_name || user.username}
                    <span className="badge bg-secondary ms-1">{ROLE_LABELS[user.role]}</span>
                  </span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-sm btn-outline-light ms-lg-2 rounded-pill px-3" onClick={handleLogout}>
                    Salir
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
