const STATUS_STYLES = {
    reservado: {cls: 'bg-warning text-dark', label: 'Reservado'},
    confirmado: {cls: 'bg-success', label: 'Confirmado'},
    cancelado: {cls: 'bg-secondary', label: 'Cancelado'},
    usado: {cls: 'bg-dark', label: 'Usado'}
};

let eventsById = {};

async function loadEventsMap() {
    const res = await apiFetch('/api/v1/events/');
    const events = await res.json();
    eventsById = Object.fromEntries(events.map(e => [e.id, e]));
}

async function loadTickets() {
    const msg = document.getElementById('ticketsMsg');
    const list = document.getElementById('ticketsList');
    try {
        const res = await apiFetch('/api/v1/tickets/my-tickets');
        if (res.status === 401) {
            window.location.href = '/login?next=/my-tickets';
            return;
        }
        const data = await res.json();
        if (!res.ok) {
            msg.innerHTML = '<div class="alert alert-danger">' + (data.detail || 'Error') + '</div>';
            return;
        }
        if (data.length === 0) {
            list.innerHTML = '<div class="alert alert-info">Todavía no tenés entradas. <a href="/">Explorá los eventos</a>.</div>';
            return;
        }
        list.innerHTML = data.map(t => renderTicket(t)).join('');
    } catch (err) {
        msg.innerHTML = '<div class="alert alert-danger">Error de conexión</div>';
    }
}

function renderTicket(t) {
    const style = STATUS_STYLES[t.status] || {cls: 'bg-secondary', label: t.status};
    const ev = eventsById[t.event_id];
    const title = ev ? ev.title : `Evento #${t.event_id}`;
    const canConfirm = t.status === 'reservado';
    const canCancel = t.status !== 'cancelado' && t.status !== 'usado';
    const canDelete = t.status === 'cancelado';
    return `
        <div class="ticket-card card">
            <div class="row g-0">
                <div class="col-md-3 ticket-stub">
                    <span class="ticket-code">${t.code}</span>
                    <span class="mt-2 badge ${style.cls} status-badge">${style.label}</span>
                </div>
                <div class="col-md-9">
                    <div class="card-body d-flex flex-column h-100">
                        <h5 class="fw-bold mb-2">${title}</h5>
                        <div class="row small text-muted mb-3">
                            <div class="col-sm-6">🪑 Butaca #${t.seat_id}</div>
                            <div class="col-sm-6">💶 ${formatPrice(t.price)}</div>
                            <div class="col-sm-6 mt-1">📅 ${ev ? formatDate(ev.start_time) : '—'}</div>
                            <div class="col-sm-6 mt-1">🧾 Compra: ${formatDate(t.purchase_date)}</div>
                        </div>
                        <div class="mt-auto d-flex gap-2">
                            ${canConfirm ? `<button class="btn btn-sm btn-success" onclick="confirmTicket(${t.id})">Confirmar</button>` : ''}
                            ${canCancel ? `<button class="btn btn-sm btn-outline-danger" onclick="cancelTicket(${t.id})">Cancelar</button>` : ''}
                            ${canDelete ? `<button class="btn btn-sm btn-danger" onclick="deleteTicket(${t.id})">Eliminar</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

async function confirmTicket(id) {
    const res = await apiFetch(`/api/v1/tickets/${id}/confirm`, {method: 'PUT'});
    if (res.ok) loadTickets();
}

async function cancelTicket(id) {
    if (!confirm('¿Seguro que querés cancelar esta entrada?')) return;
    const res = await apiFetch(`/api/v1/tickets/${id}/cancel`, {method: 'PUT'});
    if (res.ok) loadTickets();
}

async function deleteTicket(id) {
    if (!confirm('¿Seguro que querés eliminar esta entrada cancelada? Esta acción no se puede deshacer.')) return;
    const res = await apiFetch(`/api/v1/tickets/${id}`, {method: 'DELETE'});
    if (res.ok || res.status === 204) loadTickets();
}

window.confirmTicket = confirmTicket;
window.cancelTicket = cancelTicket;
window.deleteTicket = deleteTicket;

document.addEventListener('DOMContentLoaded', async () => {
    await loadEventsMap();
    loadTickets();
});
