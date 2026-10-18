from fastapi.testclient import TestClient

from app.db.session import get_db
from app.models.user import User, UserRole


def _db(client: TestClient):
    return next(client.app.dependency_overrides[get_db]())


def _register_and_login(client: TestClient, username: str, password: str = "pass123"):
    client.post(
        "/api/v1/auth/register",
        json={"email": f"{username}@example.com", "username": username, "password": password},
    )
    return client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )


def _set_role(client: TestClient, username: str, role: UserRole):
    db = _db(client)
    user = db.query(User).filter(User.username == username).first()
    user.role = role
    db.commit()
    db.close()


def test_register_assigns_cliente_role(client: TestClient):
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "nuevo@example.com", "username": "nuevo", "password": "pass123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["role"] == "cliente"
    assert data["is_admin"] is False


def test_login_sets_access_and_refresh_cookies(client: TestClient):
    _register_and_login(client, "cookieuser")
    assert client.cookies.get("access_token")
    assert client.cookies.get("refresh_token")


def test_refresh_token_returns_new_access_token(client: TestClient):
    _register_and_login(client, "refresher")
    # Forzar que el access token no sirva: borramos solo la cookie de acceso
    client.cookies.delete("access_token")
    resp = client.post("/api/v1/auth/refresh")
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    # Con el nuevo access en la cookie, /me debe funcionar
    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "refresher"


def test_refresh_without_cookie_is_unauthorized(client: TestClient):
    client.cookies.clear()
    resp = client.post("/api/v1/auth/refresh")
    assert resp.status_code == 401


def test_cliente_cannot_create_venue(client: TestClient):
    _register_and_login(client, "clientillo")
    resp = client.post(
        "/api/v1/venues/",
        json={"name": "X", "address": "Y", "city": "Z", "capacity": 10},
    )
    assert resp.status_code == 403


def test_gestor_can_create_venue_but_not_manage_users(client: TestClient):
    _register_and_login(client, "gestorcito")
    _set_role(client, "gestorcito", UserRole.GESTOR)
    venue = client.post(
        "/api/v1/venues/",
        json={"name": "Teatro Gestor", "address": "Calle 1", "city": "Madrid", "capacity": 80},
    )
    assert venue.status_code == 201
    # No puede listar usuarios (solo admin)
    users = client.get("/api/v1/users/")
    assert users.status_code == 403


def test_admin_can_list_users_and_change_role(client: TestClient):
    # Registramos el usuario objetivo (sin loguear, para no pisar la sesión admin)
    client.post(
        "/api/v1/auth/register",
        json={"email": "cambiable@example.com", "username": "cambiable", "password": "pass123"},
    )
    _register_and_login(client, "superadmin")
    _set_role(client, "superadmin", UserRole.ADMIN)

    db = _db(client)
    target_id = db.query(User).filter(User.username == "cambiable").first().id
    db.close()

    listing = client.get("/api/v1/users/")
    assert listing.status_code == 200
    assert any(u["username"] == "cambiable" for u in listing.json())

    changed = client.patch(f"/api/v1/users/{target_id}/role", json={"role": "gestor"})
    assert changed.status_code == 200
    assert changed.json()["role"] == "gestor"
