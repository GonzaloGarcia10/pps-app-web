from fastapi.testclient import TestClient
from datetime import datetime, timedelta


def test_get_events(client: TestClient):
    response = client.get("/api/v1/events/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_venue_and_event(client: TestClient):
    # Register admin
    client.post(
        "/api/v1/auth/register",
        json={"email": "admin@example.com", "username": "admin", "password": "admin123"},
    )
    # Make admin (manually for test)
    from app.models.user import User, UserRole
    db = next(client.app.dependency_overrides[__import__('app.db.session', fromlist=['']).get_db]())
    user = db.query(User).filter(User.username == "admin").first()
    user.role = UserRole.ADMIN
    db.commit()
    db.close()
    
    # Login
    login = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create venue
    venue = client.post(
        "/api/v1/venues/",
        json={"name": "Teatro Colón", "address": "Calle 123", "city": "Buenos Aires", "capacity": 100},
        headers=headers,
    )
    assert venue.status_code == 201
    venue_id = venue.json()["id"]
    
    # Create event
    start = datetime.now() + timedelta(days=1)
    event = client.post(
        "/api/v1/events/",
        json={
            "title": "Obra de Teatro",
            "description": "Una gran obra",
            "event_type": "teatro",
            "start_time": start.isoformat(),
            "venue_id": venue_id,
            "base_price": 150.0,
        },
        headers=headers,
    )
    assert event.status_code == 201
