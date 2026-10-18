from pydantic import BaseModel
from typing import Optional


class SeatBase(BaseModel):
    event_id: int
    row: str
    number: int
    section: Optional[str] = None
    price: float
    is_available: bool = True


class SeatCreate(SeatBase):
    pass


class SeatUpdate(BaseModel):
    price: Optional[float] = None
    is_available: Optional[bool] = None


class Seat(SeatBase):
    id: int

    class Config:
        from_attributes = True
