from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.api.deps import get_current_gestor_user
from app.models.event import Event, EventType
from app.schemas.event import Event as EventSchema, EventCreate, EventUpdate

router = APIRouter()


@router.get("/", response_model=List[EventSchema])
def get_events(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    event_type: Optional[EventType] = None,
    venue_id: Optional[int] = None,
    is_active: Optional[int] = None,
):
    query = db.query(Event)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if venue_id:
        query = query.filter(Event.venue_id == venue_id)
    if is_active is not None:
        query = query.filter(Event.is_active == is_active)
    events = query.order_by(Event.start_time).offset(skip).limit(limit).all()
    return events


@router.get("/{event_id}", response_model=EventSchema)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/", response_model=EventSchema, status_code=status.HTTP_201_CREATED)
def create_event(event: EventCreate, db: Session = Depends(get_db), current_user=Depends(get_current_gestor_user)):
    db_event = Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.put("/{event_id}", response_model=EventSchema)
def update_event(event_id: int, event_in: EventUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_gestor_user)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in event_in.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_gestor_user)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return None
