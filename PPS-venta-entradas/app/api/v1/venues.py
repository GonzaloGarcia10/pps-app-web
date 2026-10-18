from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_gestor_user
from app.models.venue import Venue
from app.schemas.venue import Venue as VenueSchema, VenueCreate, VenueUpdate

router = APIRouter()


@router.get("/", response_model=List[VenueSchema])
def get_venues(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    venues = db.query(Venue).offset(skip).limit(limit).all()
    return venues


@router.get("/{venue_id}", response_model=VenueSchema)
def get_venue(venue_id: int, db: Session = Depends(get_db)):
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if venue is None:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue


@router.post("/", response_model=VenueSchema, status_code=status.HTTP_201_CREATED)
def create_venue(venue: VenueCreate, db: Session = Depends(get_db), current_user=Depends(get_current_gestor_user)):
    db_venue = Venue(**venue.model_dump())
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue


@router.put("/{venue_id}", response_model=VenueSchema)
def update_venue(venue_id: int, venue_in: VenueUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_gestor_user)):
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if venue is None:
        raise HTTPException(status_code=404, detail="Venue not found")
    for field, value in venue_in.model_dump(exclude_unset=True).items():
        setattr(venue, field, value)
    db.commit()
    db.refresh(venue)
    return venue
