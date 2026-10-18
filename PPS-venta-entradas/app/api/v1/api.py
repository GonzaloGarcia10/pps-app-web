from fastapi import APIRouter

from app.api.v1 import auth, venues, events, seats, tickets, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(venues.router, prefix="/venues", tags=["venues"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(seats.router, prefix="/seats", tags=["seats"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
