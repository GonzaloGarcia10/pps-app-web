from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.db.base import Base


class TicketStatus(str, enum.Enum):
    RESERVED = "reservado"
    CONFIRMED = "confirmado"
    CANCELLED = "cancelado"
    USED = "usado"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.RESERVED)
    price = Column(Float, nullable=False)
    purchase_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    confirmation_date = Column(DateTime, nullable=True)
    
    event = relationship("Event", back_populates="tickets")
    seat = relationship("Seat", back_populates="ticket")
    user = relationship("User", back_populates="tickets")
