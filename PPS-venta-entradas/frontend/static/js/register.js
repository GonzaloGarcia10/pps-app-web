document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const full_name = document.getElementById('full_name').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('registerMsg');
    try {
        const res = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, username, full_name, password})
        });
        const data = await res.json();
        if (res.ok) {
            msg.innerHTML = '<div class="alert alert-success">Registro exitoso. Redirigiendo...</div>';
            setTimeout(() => window.location.href = '/login', 1000);
        } else {
            msg.innerHTML = '<div class="alert alert-danger">' + (data.detail || 'Error') + '</div>';
        }
    } catch (err) {
        msg.innerHTML = '<div class="alert alert-danger">Error de conexión</div>';
    }
});
