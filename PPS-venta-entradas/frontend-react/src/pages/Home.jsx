import { useEffect, useMemo, useState } from 'react'

import { apiJson } from '../api'
import EventCard from '../components/EventCard'
import { EVENT_LABELS } from '../utils'

export default function Home() {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson('/events/')
      .then((data) => setEvents(data.filter((ev) => ev.is_active !== 0)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const types = useMemo(() => ['all', ...new Set(events.map((e) => e.event_type))], [events])

  const visible = filter === 'all' ? events : events.filter((e) => e.event_type === filter)

  return (
    <>
      <section className="hero">
        <span className="lead-badge">✨ Tu próxima experiencia empieza aquí</span>
        <h1>Descubrí y reservá tus entradas</h1>
        <p className="mb-0">
          Teatro, cine, conciertos, deportes y mucho más. Elegí tu evento, escogé tu butaca y listo.
        </p>
      </section>

      <h2 className="section-title">Próximos eventos</h2>

      <div className="filter-bar">
        {types.map((t) => (
          <button
            key={t}
            className={`filter-chip ${t === filter ? 'active' : ''}`}
            onClick={() => setFilter(t)}
          >
            {EVENT_LABELS[t] || t}
          </button>
        ))}
      </div>

      {loading && <div className="text-center text-muted py-5">Cargando eventos…</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        {visible.map((ev) => (
          <div className="col-md-6 col-lg-4" key={ev.id}>
            <EventCard event={ev} />
          </div>
        ))}
      </div>

      {!loading && !error && visible.length === 0 && (
        <div className="text-center text-muted py-5">No hay eventos disponibles.</div>
      )}
    </>
  )
}
