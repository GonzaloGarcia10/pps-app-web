import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { apiFetch, apiJson } from '../api'
import { EVENT_ICONS, formatDate, formatPrice } from '../utils'

export default function EventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [seats, setSeats] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const loadSeats = useCallback(() => {
    return apiJson(`/seats/?event_id=${id}&limit=1000`).then(setSeats)
  }, [id])

  useEffect(() => {
    setLoading(true)
    apiJson(`/events/${id}`)
      .then((ev) => {
        setEvent(ev)
        return loadSeats()
      })
      .catch(() => setError('Evento no encontrado'))
      .finally(() => setLoading(false))
  }, [id, loadSeats])

  const buy = async (seatId) => {
    try {
      const res = await apiFetch('/tickets/purchase', {
        method: 'POST',
        body: JSON.stringify({ seat_id: seatId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMessage({
          type: 'success',
          text: (
            <>
              🎉 ¡Compra exitosa! Código <strong>{data.code}</strong> — {formatPrice(data.price)}. Podés
              verla en <Link to="/my-tickets">Mis Entradas</Link>.
            </>
          ),
        })
        loadSeats()
      } else if (res.status === 401) {
        setMessage({
          type: 'warning',
          text: (
            <>
              Debés <Link to="/login">iniciar sesión</Link> para comprar.
            </>
          ),
        })
      } else {
        setMessage({ type: 'danger', text: data.detail || 'Error' })
      }
    } catch {
      setMessage({ type: 'danger', text: 'Error de conexión' })
    }
  }

  if (loading) return <div className="text-center text-muted py-5">Cargando evento…</div>
  if (error) return <div className="alert alert-danger">{error}</div>

  const icon = EVENT_ICONS[event.event_type] || '🎟️'

  const rows = {}
  seats.forEach((s) => {
    const key = s.section ? `${s.section}-${s.row}` : s.row
    ;(rows[key] = rows[key] || []).push(s)
  })

  return (
    <>
      <div className="event-card card mb-4">
        <div className={`event-banner bg-${event.event_type}`} style={{ height: 170 }}>
          <span style={{ fontSize: '4rem' }}>{icon}</span>
          <span className="event-type-badge">{event.event_type}</span>
        </div>
        <div className="card-body p-4">
          <h2 className="fw-bold mb-2">{event.title}</h2>
          <p className="text-muted mb-1">📅 {formatDate(event.start_time)}</p>
          <p className="mb-3">{event.description || 'Sin descripción'}</p>
          <span className="badge bg-primary fs-6">Precio base: {formatPrice(event.base_price)}</span>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <h4 className="section-title mb-3">Elegí tus butacas</h4>
          <div className="seat-screen" />
          {seats.length === 0 ? (
            <p className="text-muted text-center mb-0">No hay butacas cargadas para este evento.</p>
          ) : (
            <div className="text-center">
              {Object.keys(rows)
                .sort()
                .map((key) => {
                  const rowSeats = [...rows[key]].sort((a, b) => a.number - b.number)
                  return (
                    <div className="seat-row" key={key}>
                      <span className="seat-row-label">{rowSeats[0].row}</span>
                      {rowSeats.map((s) =>
                        s.is_available ? (
                          <button
                            key={s.id}
                            className="seat-btn"
                            title={`Fila ${s.row}, asiento ${s.number} — ${formatPrice(s.price)}`}
                            onClick={() => buy(s.id)}
                          >
                            {s.number}
                          </button>
                        ) : (
                          <button
                            key={s.id}
                            className="seat-btn"
                            disabled
                            style={{
                              background: '#e5e7eb',
                              borderColor: '#d1d5db',
                              color: '#9ca3af',
                              cursor: 'not-allowed',
                            }}
                            title="Ocupado"
                          >
                            {s.number}
                          </button>
                        ),
                      )}
                    </div>
                  )
                })}
            </div>
          )}
          <div className="seat-legend">
            <span className="legend-free">Disponible</span>
            <span className="legend-occupied">Ocupado</span>
          </div>
        </div>
      </div>

      {message && <div className={`alert alert-${message.type} mt-3`}>{message.text}</div>}
    </>
  )
}
