const eventId = window.location.pathname.split('/').pop();

async function loadEvent() {
    const res = await fetch(`/api/v1/events/${eventId}`);
    if (!res.ok) {
        document.getElementById('eventDetail').innerHTML =
            '<div class="alert alert-danger">Evento no encontrado</div>';
        return;
    }
    const ev = await res.json();
    const icon = EVENT_ICONS[ev.event_type] || '🎟️';
    document.getElementById('eventDetail').innerHTML = `
        <div class="event-card card">
            <div class="event-banner bg-${ev.event_type}" style="height:170px">
                <span style="font-size:4rem">${icon}</span>
                <span class="event-type-badge">${ev.event_type}</span>
            </div>
            <div class="card-body p-4">
                <h2 class="fw-bold mb-2">${ev.title}</h2>
                <p class="text-muted mb-1">📅 ${formatDate(ev.start_time)}</p>
                <p class="mb-3">${ev.description || 'Sin descripción'}</p>
                <span class="badge bg-primary fs-6">Precio base: ${formatPrice(ev.base_price)}</span>
            </div>
        </div>`;
    loadSeats();
}

async function loadSeats() {
    const res = await fetch(`/api/v1/seats/?event_id=${eventId}&limit=1000`);
    const seats = await res.json();
    const list = document.getElementById('seatsList');
    list.innerHTML = '';

    if (seats.length === 0) {
        list.innerHTML = '<p class="text-muted">No hay butacas cargadas para este evento.</p>';
        return;
    }

    const rows = {};
    seats.forEach(s => {
        const key = s.section ? `${s.section}-${s.row}` : s.row;
        (rows[key] = rows[key] || []).push(s);
    });

    Object.keys(rows).sort().forEach(key => {
        const rowSeats = rows[key].sort((a, b) => a.number - b.number);
        const label = rowSeats[0].row;
        const rowEl = document.createElement('div');
        rowEl.className = 'seat-row';
        const buttons = rowSeats.map(s => {
            if (s.is_available) {
                return `<button class="seat-btn" title="Fila ${s.row}, asiento ${s.number} — ${formatPrice(s.price)}"
                            onclick="buy(${s.id})">${s.number}</button>`;
            }
            return `<button class="seat-btn" disabled
                        style="background:#e5e7eb;border-color:#d1d5db;color:#9ca3af;cursor:not-allowed"
                        title="Ocupado">${s.number}</button>`;
        }).join('');
        rowEl.innerHTML = `<span class="seat-row-label">${label}</span>${buttons}`;
        list.appendChild(rowEl);
    });
}

async function buy(seatId) {
    const msg = document.getElementById('seatMsg');
    try {
        const res = await apiFetch('/api/v1/tickets/purchase', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({seat_id: seatId})
        });
        const data = await res.json();
        if (res.ok) {
            msg.innerHTML = `<div class="alert alert-success">🎉 ¡Compra exitosa! Código <strong>${data.code}</strong> — ${formatPrice(data.price)}. Podés verla en <a href="/my-tickets">Mis Entradas</a>.</div>`;
            loadSeats();
        } else if (res.status === 401) {
            msg.innerHTML = '<div class="alert alert-warning">Debés <a href="/login">iniciar sesión</a> para comprar.</div>';
        } else {
            msg.innerHTML = '<div class="alert alert-danger">' + (data.detail || 'Error') + '</div>';
        }
    } catch (err) {
        msg.innerHTML = '<div class="alert alert-danger">Error de conexión</div>';
    }
}

window.buy = buy;
document.addEventListener('DOMContentLoaded', loadEvent);
