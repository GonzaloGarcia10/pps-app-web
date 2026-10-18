from pydantic import BaseModel
from typing import Optional


class VenueBase(BaseModel):
    name: str
    address: str
    city: str
    capacity: int
    description: Optional[str] = None


class VenueCreate(VenueBase):
    pass


class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None


class Venue(VenueBase):
    id: int

    class Config:
        from_attributes = True
