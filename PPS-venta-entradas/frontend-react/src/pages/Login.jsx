import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../auth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ username: '', password: '' })
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      await login(form.username, form.password)
      setMessage({ type: 'success', text: 'Login exitoso' })
      const next = params.get('next') || '/'
      setTimeout(() => navigate(next), 500)
    } catch (err) {
      setMessage({ type: 'danger', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card auth-card">
          <div className="card-header">
            <h4>🎟️ Iniciar Sesión</h4>
          </div>
          <div className="card-body p-4">
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={busy}>
                {busy ? 'Entrando…' : 'Entrar'}
              </button>
              <div className="text-center mt-3">
                <span className="text-muted small">¿No tenés cuenta?</span>{' '}
                <Link to="/register" className="small fw-semibold">
                  Registrate
                </Link>
              </div>
            </form>
            {message && <div className={`alert alert-${message.type} mt-3`}>{message.text}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
