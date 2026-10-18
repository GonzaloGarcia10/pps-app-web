from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.ticket import TicketStatus


class TicketBase(BaseModel):
    event_id: int
    seat_id: int
    user_id: int
    status: TicketStatus = TicketStatus.RESERVED
    price: float


class TicketCreate(BaseModel):
    event_id: int
    seat_id: int
    user_id: Optional[int] = None


class TicketPurchase(BaseModel):
    seat_id: int


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None


class Ticket(TicketBase):
    id: int
    code: str
    purchase_date: datetime
    confirmation_date: Optional[datetime] = None

    class Config:
        from_attributes = True
