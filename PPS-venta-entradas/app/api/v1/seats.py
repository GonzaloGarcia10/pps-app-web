from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_gestor_user
from app.models.seat import Seat
from app.schemas.seat import Seat as SeatSchema, SeatCreate, SeatUpdate

router = APIRouter()


@router.get("/", response_model=List[SeatSchema])
def get_seats(db: Session = Depends(get_db), skip: int = 0, limit: int = 100, event_id: int = None):
    query = db.query(Seat)
    if event_id:
        query = query.filter(Seat.event_id == event_id)
    seats = query.offset(skip).limit(limit).all()
    return seats


@router.get("/{seat_id}", response_model=SeatSchema)
def get_seat(seat_id: int, db: Session = Depends(get_db)):
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if seat is None:
        raise HTTPException(status_code=404, detail="Seat not found")
    return seat


@router.post("/", response_model=SeatSchema, status_code=status.HTTP_201_CREATED)
def create_seat(seat: SeatCreate, db: Session = Depends(get_db), current_user=Depends(get_current_gestor_user)):
    db_seat = Seat(**seat.model_dump())
    db.add(db_seat)
    db.commit()
    db.refresh(db_seat)
    return db_seat


@router.post("/bulk", response_model=List[SeatSchema], status_code=status.HTTP_201_CREATED)
def create_seats_bulk(seats: List[SeatCreate], db: Session = Depends(get_db), current_user=Depends(get_current_gestor_user)):
    db_seats = []
    for seat in seats:
        db_seat = Seat(**seat.model_dump())
        db.add(db_seat)
        db_seats.append(db_seat)
    db.commit()
    for db_seat in db_seats:
        db.refresh(db_seat)
    return db_seats


@router.get("/event/{event_id}/available", response_model=List[SeatSchema])
def get_available_seats(event_id: int, db: Session = Depends(get_db)):
    seats = db.query(Seat).filter(Seat.event_id == event_id, Seat.is_available == True).all()
    return seats
