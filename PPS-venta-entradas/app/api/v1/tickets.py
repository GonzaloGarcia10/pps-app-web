import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_active_user, get_current_gestor_user
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus
from app.models.seat import Seat
from app.models.event import Event
from app.schemas.ticket import Ticket as TicketSchema, TicketPurchase, TicketUpdate

router = APIRouter()


def _can_manage(user: User) -> bool:
    """admin y gestor pueden operar sobre entradas de cualquier usuario."""
    return user.role in (UserRole.ADMIN, UserRole.GESTOR)


def generate_ticket_code() -> str:
    return str(uuid.uuid4())[:8].upper()


@router.post("/purchase", response_model=TicketSchema, status_code=status.HTTP_201_CREATED)
def purchase_ticket(
    ticket_purchase: TicketPurchase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seat = db.query(Seat).filter(Seat.id == ticket_purchase.seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    if not seat.is_available:
        raise HTTPException(status_code=400, detail="Seat not available")
    
    event = db.query(Event).filter(Event.id == seat.event_id).first()
    if not event or event.is_active != 1:
        raise HTTPException(status_code=400, detail="Event not active or not found")
    
    # Marcar asiento como no disponible
    seat.is_available = False
    
    # Crear ticket
    ticket = Ticket(
        code=generate_ticket_code(),
        event_id=seat.event_id,
        seat_id=seat.id,
        user_id=current_user.id,
        status=TicketStatus.RESERVED,
        price=seat.price or event.base_price,
        purchase_date=datetime.now(timezone.utc),
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/my-tickets", response_model=List[TicketSchema])
def get_my_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    tickets = db.query(Ticket).filter(Ticket.user_id == current_user.id).all()
    return tickets


@router.get("/{ticket_id}", response_model=TicketSchema)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.user_id != current_user.id and not _can_manage(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return ticket


@router.get("/code/{ticket_code}", response_model=TicketSchema)
def get_ticket_by_code(ticket_code: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.code == ticket_code).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.put("/{ticket_id}/confirm", response_model=TicketSchema)
def confirm_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.user_id != current_user.id and not _can_manage(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ticket.status = TicketStatus.CONFIRMED
    ticket.confirmation_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.put("/{ticket_id}/cancel", response_model=TicketSchema)
def cancel_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.user_id != current_user.id and not _can_manage(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if ticket.status == TicketStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Ticket already cancelled")
    
    # Liberar asiento
    seat = db.query(Seat).filter(Seat.id == ticket.seat_id).first()
    if seat:
        seat.is_available = True
    
    ticket.status = TicketStatus.CANCELLED
    db.commit()
    db.refresh(ticket)
    return ticket


@router.put("/{ticket_id}/use", response_model=TicketSchema)
def use_ticket(ticket_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_gestor_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != TicketStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Ticket must be confirmed first")
    ticket.status = TicketStatus.USED
    db.commit()
    db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.user_id != current_user.id and not _can_manage(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if ticket.status != TicketStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar entradas canceladas")
    db.delete(ticket)
    db.commit()
    return None
