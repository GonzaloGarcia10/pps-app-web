from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.db.base import Base


class EventType(str, enum.Enum):
    CINE = "cine"
    TEATRO = "teatro"
    CONCIERTO = "concierto"
    DEPORTE = "deporte"
    CONGRESO = "congreso"
    OTRO = "otro"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    event_type = Column(Enum(EventType), nullable=False, default=EventType.OTRO)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    base_price = Column(Float, nullable=False, default=0.0)
    image_url = Column(String, nullable=True)
    is_active = Column(Integer, default=1)  # 1 = activo, 0 = cancelado
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    venue = relationship("Venue", back_populates="events")
    seats = relationship("Seat", back_populates="event")
    tickets = relationship("Ticket", back_populates="event")
