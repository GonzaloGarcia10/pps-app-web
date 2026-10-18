import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { apiJson } from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '' })
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      await apiJson('/auth/register', { method: 'POST', body: JSON.stringify(form) })
      setMessage({ type: 'success', text: 'Registro exitoso. Redirigiendo…' })
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      setMessage({ type: 'danger', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const field = (name, label, type = 'text') => (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-control"
        required={name !== 'full_name'}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
    </div>
  )

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card auth-card">
          <div className="card-header">
            <h4>🎟️ Crear cuenta</h4>
          </div>
          <div className="card-body p-4">
            <form onSubmit={submit}>
              {field('email', 'Email', 'email')}
              {field('username', 'Usuario')}
              {field('full_name', 'Nombre completo')}
              {field('password', 'Contraseña', 'password')}
              <button type="submit" className="btn btn-primary w-100" disabled={busy}>
                {busy ? 'Registrando…' : 'Registrarme'}
              </button>
              <div className="text-center mt-3">
                <span className="text-muted small">¿Ya tenés cuenta?</span>{' '}
                <Link to="/login" className="small fw-semibold">
                  Iniciá sesión
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
