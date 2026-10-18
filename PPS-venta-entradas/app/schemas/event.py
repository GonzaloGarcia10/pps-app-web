from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.event import EventType


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType = EventType.OTRO
    start_time: datetime
    end_time: Optional[datetime] = None
    venue_id: int
    base_price: float = 0.0
    image_url: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    venue_id: Optional[int] = None
    base_price: Optional[float] = None
    image_url: Optional[str] = None
    is_active: Optional[int] = None


class Event(EventBase):
    id: int
    is_active: int

    class Config:
        from_attributes = True
