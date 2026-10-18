from fastapi.testclient import TestClient
from datetime import datetime, timedelta


def test_purchase_ticket_flow(client: TestClient):
    # Register user
    client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com", "username": "user", "password": "user123"},
    )
    # Register admin
    client.post(
        "/api/v1/auth/register",
        json={"email": "admin2@example.com", "username": "admin2", "password": "admin123"},
    )
    from app.models.user import User, UserRole
    db = next(client.app.dependency_overrides[__import__('app.db.session', fromlist=['']).get_db]())
    admin = db.query(User).filter(User.username == "admin2").first()
    admin.role = UserRole.ADMIN
    db.commit()
    db.close()
    
    # Admin login
    login_admin = client.post(
        "/api/v1/auth/login",
        data={"username": "admin2", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    admin_token = login_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create venue
    venue = client.post(
        "/api/v1/venues/",
        json={"name": "Cine", "address": "Av 456", "city": "CABA", "capacity": 50},
        headers=admin_headers,
    )
    venue_id = venue.json()["id"]
    
    # Create event
    start = datetime.now() + timedelta(days=1)
    event = client.post(
        "/api/v1/events/",
        json={
            "title": "Pelicula",
            "event_type": "cine",
            "start_time": start.isoformat(),
            "venue_id": venue_id,
            "base_price": 100.0,
        },
        headers=admin_headers,
    )
    event_id = event.json()["id"]
    
    # Create seat
    seat = client.post(
        "/api/v1/seats/",
        json={
            "event_id": event_id,
            "row": "A",
            "number": 1,
            "price": 100.0,
            "is_available": True,
        },
        headers=admin_headers,
    )
    seat_id = seat.json()["id"]
    
    # User login
    login_user = client.post(
        "/api/v1/auth/login",
        data={"username": "user", "password": "user123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    user_token = login_user.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Purchase ticket
    purchase = client.post(
        "/api/v1/tickets/purchase",
        json={"seat_id": seat_id},
        headers=user_headers,
    )
    assert purchase.status_code == 201
    ticket = purchase.json()
    assert ticket["status"] == "reservado"
    assert ticket["code"] is not None
