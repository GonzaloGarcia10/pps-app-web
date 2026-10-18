function showMsg(text, type = 'success') {
    document.getElementById('adminMsg').innerHTML = `<div class="alert alert-${type}">${text}</div>`;
}

async function loadVenues() {
    const res = await apiFetch('/api/v1/venues/');
    const venues = await res.json();
    document.getElementById('venuesList').innerHTML = venues.map(v =>
        `<div class="border-bottom py-1"><strong>${v.name}</strong> — ${v.city} (${v.capacity} lugares) [ID ${v.id}]</div>`
    ).join('');
    const sel = document.getElementById('e_venue');
    sel.innerHTML = venues.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
}

async function loadEvents() {
    const res = await apiFetch('/api/v1/events/');
    const events = await res.json();
    document.getElementById('eventsList').innerHTML = events.map(e =>
        `<div class="border-bottom py-1"><strong>${e.title}</strong> — ${e.event_type} — ${formatPrice(e.base_price)} [ID ${e.id}]</div>`
    ).join('');
    const sel = document.getElementById('s_event');
    sel.innerHTML = events.map(e => `<option value="${e.id}">${e.title}</option>`).join('');
}

document.getElementById('venueForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        name: document.getElementById('v_name').value,
        address: document.getElementById('v_address').value,
        city: document.getElementById('v_city').value,
        capacity: parseInt(document.getElementById('v_capacity').value),
    };
    const res = await apiFetch('/api/v1/venues/', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
    });
    if (res.ok) { showMsg('Recinto creado'); e.target.reset(); loadVenues(); }
    else showMsg((await res.json()).detail || 'Error', 'danger');
});

document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        title: document.getElementById('e_title').value,
        event_type: document.getElementById('e_type').value,
        start_time: document.getElementById('e_start').value,
        venue_id: parseInt(document.getElementById('e_venue').value),
        base_price: parseFloat(document.getElementById('e_price').value),
    };
    const res = await apiFetch('/api/v1/events/', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
    });
    if (res.ok) { showMsg('Evento creado'); e.target.reset(); loadEvents(); }
    else showMsg((await res.json()).detail || 'Error', 'danger');
});

document.getElementById('seatsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const event_id = parseInt(document.getElementById('s_event').value);
    const row = document.getElementById('s_row').value;
    const from = parseInt(document.getElementById('s_from').value);
    const to = parseInt(document.getElementById('s_to').value);
    const price = parseFloat(document.getElementById('s_price').value);
    const seats = [];
    for (let n = from; n <= to; n++) seats.push({event_id, row, number: n, price, is_available: true});
    const res = await apiFetch('/api/v1/seats/bulk', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(seats)
    });
    if (res.ok) { showMsg(`${seats.length} asientos creados`); e.target.reset(); loadSeatsAdmin(); }
    else showMsg((await res.json()).detail || 'Error', 'danger');
});

async function loadSeatsAdmin() {
    const eventId = document.getElementById('s_event').value;
    if (!eventId) return;
    const res = await apiFetch(`/api/v1/seats/?event_id=${eventId}&limit=1000`);
    const seats = await res.json();
    document.getElementById('seatsAdminList').innerHTML =
        `<p>${seats.length} asientos. Disponibles: ${seats.filter(s => s.is_available).length}</p>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Protección adicional en cliente; el servidor ya exige admin para /admin
    const res = await apiFetch('/api/v1/auth/me');
    const user = res.ok ? await res.json() : null;
    if (!user || (user.role !== 'admin' && user.role !== 'gestor')) {
        window.location.href = '/login?next=/admin';
        return;
    }
    await loadVenues();
    await loadEvents();
});
