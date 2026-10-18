// La sesión viaja en una cookie HttpOnly gestionada por el servidor.
// El frontend NO puede leer el token; solo consulta /auth/me para saber el estado.

const EVENT_ICONS = {
    cine: '🎬', teatro: '🎭', concierto: '🎵',
    deporte: '🏆', congreso: '💼', otro: '🎟️'
};

function formatPrice(value) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR'
    }).format(value || 0);
}

function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// fetch con cookies incluidas (same-origin) y manejo de 401
async function apiFetch(url, options = {}) {
    options.credentials = 'same-origin';
    const res = await fetch(url, options);
    return res;
}

function showNavFor(user) {
    const set = (id, show) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('d-none', !show);
    };
    set('loginNav', !user);
    set('registerNav', !user);
    set('ticketsNav', !!user);
    set('logoutNav', !!user);
    set('userNav', !!user);
    set('adminNav', !!(user && (user.role === 'admin' || user.role === 'gestor')));
    if (user) {
        const el = document.getElementById('userName');
        if (el) el.textContent = user.full_name || user.username;
    }
}

async function updateNav() {
    try {
        const res = await apiFetch('/api/v1/auth/me');
        showNavFor(res.ok ? await res.json() : null);
    } catch (err) {
        showNavFor(null);
    }
}

async function logout() {
    try {
        await apiFetch('/api/v1/auth/logout', {method: 'POST'});
    } catch (err) { /* ignorar */ }
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', updateNav);
