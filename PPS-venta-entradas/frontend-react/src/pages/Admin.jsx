import { useCallback, useEffect, useState } from 'react'

import { apiJson } from '../api'
import { useAuth } from '../auth'
import { EVENT_TYPES, ROLE_LABELS, USER_ROLES, formatPrice } from '../utils'

const emptyVenue = { name: '', address: '', city: '', capacity: '' }
const emptyEvent = { title: '', event_type: 'cine', start_time: '', venue_id: '', base_price: '' }
const emptySeats = { event_id: '', row: '', from: '', to: '', price: '' }
const emptyUser = { email: '', username: '', full_name: '', password: '', role: 'cliente' }

export default function Admin() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState('venues')
  const [message, setMessage] = useState(null)

  const [venues, setVenues] = useState([])
  const [events, setEvents] = useState([])
  const [seatsSummary, setSeatsSummary] = useState(null)
  const [users, setUsers] = useState([])

  const [venueForm, setVenueForm] = useState(emptyVenue)
  const [eventForm, setEventForm] = useState(emptyEvent)
  const [seatsForm, setSeatsForm] = useState(emptySeats)
  const [userForm, setUserForm] = useState(emptyUser)

  const notify = (text, type = 'success') => setMessage({ text, type })

  const loadVenues = useCallback(() => apiJson('/venues/').then(setVenues), [])
  const loadEvents = useCallback(() => apiJson('/events/').then(setEvents), [])
  const loadUsers = useCallback(() => apiJson('/users/').then(setUsers), [])

  useEffect(() => {
    loadVenues().catch((e) => notify(e.message, 'danger'))
    loadEvents().catch((e) => notify(e.message, 'danger'))
  }, [loadVenues, loadEvents])

  useEffect(() => {
    if (tab === 'users' && isAdmin) loadUsers().catch((e) => notify(e.message, 'danger'))
  }, [tab, isAdmin, loadUsers])

  const submitVenue = async (e) => {
    e.preventDefault()
    try {
      await apiJson('/venues/', {
        method: 'POST',
        body: JSON.stringify({ ...venueForm, capacity: parseInt(venueForm.capacity, 10) }),
      })
      notify('Recinto creado')
      setVenueForm(emptyVenue)
      loadVenues()
    } catch (err) {
      notify(err.message, 'danger')
    }
  }

  const submitEvent = async (e) => {
    e.preventDefault()
    try {
      await apiJson('/events/', {
        method: 'POST',
        body: JSON.stringify({
          ...eventForm,
          venue_id: parseInt(eventForm.venue_id, 10),
          base_price: parseFloat(eventForm.base_price),
        }),
      })
      notify('Evento creado')
      setEventForm(emptyEvent)
      loadEvents()
    } catch (err) {
      notify(err.message, 'danger')
    }
  }

  const submitSeats = async (e) => {
    e.preventDefault()
    const event_id = parseInt(seatsForm.event_id, 10)
    const from = parseInt(seatsForm.from, 10)
    const to = parseInt(seatsForm.to, 10)
    const price = parseFloat(seatsForm.price)
    const seats = []
    for (let n = from; n <= to; n++) {
      seats.push({ event_id, row: seatsForm.row, number: n, price, is_available: true })
    }
    try {
      await apiJson('/seats/bulk', { method: 'POST', body: JSON.stringify(seats) })
      notify(`${seats.length} asientos creados`)
      setSeatsForm(emptySeats)
      loadSeatsSummary(event_id)
    } catch (err) {
      notify(err.message, 'danger')
    }
  }

  const loadSeatsSummary = async (eventId) => {
    if (!eventId) return
    const seats = await apiJson(`/seats/?event_id=${eventId}&limit=1000`)
    setSeatsSummary({
      total: seats.length,
      available: seats.filter((s) => s.is_available).length,
    })
  }

  const submitUser = async (e) => {
    e.preventDefault()
    try {
      await apiJson('/users/', { method: 'POST', body: JSON.stringify(userForm) })
      notify('Usuario creado')
      setUserForm(emptyUser)
      loadUsers()
    } catch (err) {
      notify(err.message, 'danger')
    }
  }

  const changeRole = async (id, role) => {
    try {
      await apiJson(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
      notify('Rol actualizado')
      loadUsers()
    } catch (err) {
      notify(err.message, 'danger')
      loadUsers()
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return
    try {
      await apiJson(`/users/${id}`, { method: 'DELETE' })
      notify('Usuario eliminado')
      loadUsers()
    } catch (err) {
      notify(err.message, 'danger')
    }
  }

  const tabs = [
    { id: 'venues', label: '🏛️ Recintos' },
    { id: 'events', label: '🎭 Eventos' },
    { id: 'seats', label: '🪑 Butacas' },
    ...(isAdmin ? [{ id: 'users', label: '👥 Usuarios' }] : []),
  ]

  return (
    <>
      <h2 className="section-title">Panel de Administración</h2>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <ul className="nav nav-tabs mt-3" role="tablist">
        {tabs.map((t) => (
          <li className="nav-item" key={t.id}>
            <button
              className={`nav-link ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              type="button"
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="tab-content border border-top-0 p-4">
        {tab === 'venues' && (
          <>
            <h5 className="fw-bold mb-3">Nuevo recinto</h5>
            <form className="row g-2 mb-4" onSubmit={submitVenue}>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Nombre"
                  required
                  value={venueForm.name}
                  onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Dirección"
                  required
                  value={venueForm.address}
                  onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Ciudad"
                  required
                  value={venueForm.city}
                  onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Capacidad"
                  required
                  value={venueForm.capacity}
                  onChange={(e) => setVenueForm({ ...venueForm, capacity: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100">Crear</button>
              </div>
            </form>
            <div>
              {venues.map((v) => (
                <div className="border-bottom py-1" key={v.id}>
                  <strong>{v.name}</strong> — {v.city} ({v.capacity} lugares) [ID {v.id}]
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'events' && (
          <>
            <h5 className="fw-bold mb-3">Nuevo evento</h5>
            <form className="row g-2 mb-4" onSubmit={submitEvent}>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Título"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                >
                  {EVENT_TYPES.map((t) => (
                    <option value={t} key={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <input
                  type="datetime-local"
                  className="form-control"
                  required
                  value={eventForm.start_time}
                  onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  required
                  value={eventForm.venue_id}
                  onChange={(e) => setEventForm({ ...eventForm, venue_id: e.target.value })}
                >
                  <option value="">Recinto…</option>
                  {venues.map((v) => (
                    <option value={v.id} key={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-1">
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="€"
                  required
                  value={eventForm.base_price}
                  onChange={(e) => setEventForm({ ...eventForm, base_price: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100">Crear</button>
              </div>
            </form>
            <div>
              {events.map((ev) => (
                <div className="border-bottom py-1" key={ev.id}>
                  <strong>{ev.title}</strong> — {ev.event_type} — {formatPrice(ev.base_price)} [ID{' '}
                  {ev.id}]
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'seats' && (
          <>
            <h5 className="fw-bold mb-3">Generar butacas por fila</h5>
            <form className="row g-2 mb-4" onSubmit={submitSeats}>
              <div className="col-md-3">
                <select
                  className="form-select"
                  required
                  value={seatsForm.event_id}
                  onChange={(e) => {
                    const event_id = e.target.value
                    setSeatsForm({ ...seatsForm, event_id })
                    loadSeatsSummary(event_id)
                  }}
                >
                  <option value="">Evento…</option>
                  {events.map((ev) => (
                    <option value={ev.id} key={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-1">
                <input
                  className="form-control"
                  placeholder="Fila"
                  required
                  value={seatsForm.row}
                  onChange={(e) => setSeatsForm({ ...seatsForm, row: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Desde"
                  required
                  value={seatsForm.from}
                  onChange={(e) => setSeatsForm({ ...seatsForm, from: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Hasta"
                  required
                  value={seatsForm.to}
                  onChange={(e) => setSeatsForm({ ...seatsForm, to: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="Precio €"
                  required
                  value={seatsForm.price}
                  onChange={(e) => setSeatsForm({ ...seatsForm, price: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100">Generar</button>
              </div>
            </form>
            {seatsSummary && (
              <p>
                {seatsSummary.total} asientos. Disponibles: {seatsSummary.available}
              </p>
            )}
          </>
        )}

        {tab === 'users' && isAdmin && (
          <>
            <h5 className="fw-bold mb-3">Nuevo usuario</h5>
            <form className="row g-2 mb-4" onSubmit={submitUser}>
              <div className="col-md-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Usuario"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Nombre"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Contraseña"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>
              <div className="col-md-1">
                <select
                  className="form-select"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  {USER_ROLES.map((r) => (
                    <option value={r} key={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100">Crear</button>
              </div>
            </form>

            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td className="text-muted small">{u.email}</td>
                    <td style={{ maxWidth: 160 }}>
                      <select
                        className="form-select form-select-sm"
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={u.id === user.id}
                      >
                        {USER_ROLES.map((r) => (
                          <option value={r} key={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteUser(u.id)}
                        disabled={u.id === user.id}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  )
}
