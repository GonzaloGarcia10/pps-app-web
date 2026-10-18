from fastapi.testclient import TestClient


def test_register_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "test123",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"


def test_register_duplicate_email(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "username": "testuser", "password": "test123"},
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "username": "testuser2", "password": "test123"},
    )
    assert response.status_code == 400


def test_login_user(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "username": "testuser", "password": "test123"},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "test123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
