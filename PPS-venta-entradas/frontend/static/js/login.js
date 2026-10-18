document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('loginMsg');
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    try {
        const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            // El servidor guardó el JWT en una cookie HttpOnly.
            msg.innerHTML = '<div class="alert alert-success">Login exitoso</div>';
            const next = new URLSearchParams(window.location.search).get('next') || '/';
            setTimeout(() => window.location.href = next, 800);
        } else {
            msg.innerHTML = '<div class="alert alert-danger">' + (data.detail || 'Error') + '</div>';
        }
    } catch (err) {
        msg.innerHTML = '<div class="alert alert-danger">Error de conexión</div>';
    }
});
