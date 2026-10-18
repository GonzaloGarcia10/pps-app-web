import { Link } from 'react-router-dom'

import { EVENT_ICONS, formatDate, formatPrice } from '../utils'

export default function EventCard({ event }) {
  const icon = EVENT_ICONS[event.event_type] || '🎟️'
  return (
    <div className="event-card card">
      <div className={`event-banner bg-${event.event_type}`}>
        <span>{icon}</span>
        <span className="event-type-badge">{event.event_type}</span>
      </div>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{event.title}</h5>
        <p className="event-date mb-3">📅 {formatDate(event.start_time)}</p>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="event-price">Desde {formatPrice(event.base_price)}</span>
          <Link to={`/events/${event.id}`} className="btn btn-primary btn-sm">
            Ver butacas
          </Link>
        </div>
      </div>
    </div>
  )
}
