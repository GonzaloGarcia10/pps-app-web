import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch, apiJson } from '../api'
import { STATUS_STYLES, formatDate, formatPrice } from '../utils'

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [eventsById, setEventsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTickets = useCallback(() => {
    return apiJson('/tickets/my-tickets').then(setTickets)
  }, [])

  useEffect(() => {
    Promise.all([apiJson('/events/'), loadTickets()])
      .then(([events]) => {
        setEventsById(Object.fromEntries(events.map((e) => [e.id, e])))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [loadTickets])

  const action = async (id, path, method) => {
    const res = await apiFetch(`/tickets/${id}${path}`, { method })
    if (res.ok) loadTickets()
  }

  const confirmTicket = (id) => action(id, '/confirm', 'PUT')

  const cancelTicket = (id) => {
    if (window.confirm('¿Seguro que querés cancelar esta entrada?')) {
      action(id, '/cancel', 'PUT')
    }
  }

  const deleteTicket = (id) => {
    if (
      window.confirm(
        '¿Seguro que querés eliminar esta entrada cancelada? Esta acción no se puede deshacer.',
      )
    ) {
      action(id, '', 'DELETE')
    }
  }

  if (loading) return <div className="text-center text-muted py-5">Cargando tus entradas…</div>

  return (
    <>
      <h2 className="section-title">Mis Entradas</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {tickets.length === 0 ? (
        <div className="alert alert-info">
          Todavía no tenés entradas. <Link to="/">Explorá los eventos</Link>.
        </div>
      ) : (
        tickets.map((t) => {
          const style = STATUS_STYLES[t.status] || { cls: 'bg-secondary', label: t.status }
          const ev = eventsById[t.event_id]
          const title = ev ? ev.title : `Evento #${t.event_id}`
          const canConfirm = t.status === 'reservado'
          const canCancel = t.status !== 'cancelado' && t.status !== 'usado'
          const canDelete = t.status === 'cancelado'

          return (
            <div className="ticket-card card" key={t.id}>
              <div className="row g-0">
                <div className="col-md-3 ticket-stub">
                  <span className="ticket-code">{t.code}</span>
                  <span className={`mt-2 badge ${style.cls} status-badge`}>{style.label}</span>
                </div>
                <div className="col-md-9">
                  <div className="card-body d-flex flex-column h-100">
                    <h5 className="fw-bold mb-2">{title}</h5>
                    <div className="row small text-muted mb-3">
                      <div className="col-sm-6">🪑 Butaca #{t.seat_id}</div>
                      <div className="col-sm-6">💶 {formatPrice(t.price)}</div>
                      <div className="col-sm-6 mt-1">📅 {ev ? formatDate(ev.start_time) : '—'}</div>
                      <div className="col-sm-6 mt-1">🧾 Compra: {formatDate(t.purchase_date)}</div>
                    </div>
                    <div className="mt-auto d-flex gap-2">
                      {canConfirm && (
                        <button className="btn btn-sm btn-success" onClick={() => confirmTicket(t.id)}>
                          Confirmar
                        </button>
                      )}
                      {canCancel && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => cancelTicket(t.id)}
                        >
                          Cancelar
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn btn-sm btn-danger" onClick={() => deleteTicket(t.id)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </>
  )
}
