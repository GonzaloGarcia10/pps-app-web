let allEvents = [];
let activeFilter = 'all';

async function loadEvents() {
    const res = await fetch('/api/v1/events/');
    allEvents = (await res.json()).filter(ev => ev.is_active != 0);
    buildFilters();
    renderEvents();
}

function buildFilters() {
    const types = ['all', ...new Set(allEvents.map(e => e.event_type))];
    const labels = {all: 'Todos', cine: 'Cine', teatro: 'Teatro', concierto: 'Conciertos',
                    deporte: 'Deportes', congreso: 'Congresos', otro: 'Otros'};
    document.getElementById('filterBar').innerHTML = types.map(t =>
        `<button class="filter-chip ${t === activeFilter ? 'active' : ''}" data-type="${t}">${labels[t] || t}</button>`
    ).join('');
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            activeFilter = btn.dataset.type;
            buildFilters();
            renderEvents();
        });
    });
}

function renderEvents() {
    const list = document.getElementById('eventsList');
    const empty = document.getElementById('eventsEmpty');
    const events = activeFilter === 'all'
        ? allEvents
        : allEvents.filter(e => e.event_type === activeFilter);
    list.innerHTML = '';
    if (events.length === 0) { empty.classList.remove('d-none'); return; }
    empty.classList.add('d-none');
    events.forEach(ev => {
        const icon = EVENT_ICONS[ev.event_type] || '🎟️';
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="event-card card">
                <div class="event-banner bg-${ev.event_type}">
                    <span>${icon}</span>
                    <span class="event-type-badge">${ev.event_type}</span>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${ev.title}</h5>
                    <p class="event-date mb-3">📅 ${formatDate(ev.start_time)}</p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="event-price">Desde ${formatPrice(ev.base_price)}</span>
                        <a href="/events/${ev.id}" class="btn btn-primary btn-sm">Ver butacas</a>
                    </div>
                </div>
            </div>`;
        list.appendChild(col);
    });
}

document.addEventListener('DOMContentLoaded', loadEvents);
