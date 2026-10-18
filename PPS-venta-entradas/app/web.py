from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User, UserRole

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "frontend" / "static"
templates = Jinja2Templates(directory=str(BASE_DIR / "frontend" / "templates"))


def _asset_version() -> str:
    """Versión basada en la fecha de modificación de los assets (cache-busting)."""
    latest = 0
    if STATIC_DIR.exists():
        for f in STATIC_DIR.rglob("*"):
            if f.is_file():
                latest = max(latest, int(f.stat().st_mtime))
    return str(latest)


templates.env.globals["asset_version"] = _asset_version()

router = APIRouter()


def get_user_from_cookie(request: Request) -> Optional[User]:
    """Valida el JWT guardado en la cookie y devuelve el usuario (o None)."""
    token = request.cookies.get(settings.COOKIE_NAME)
    if not token:
        return None
    username = decode_access_token(token)
    if not username:
        return None
    db = SessionLocal()
    try:
        return db.query(User).filter(User.username == username).first()
    finally:
        db.close()


@router.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "index.html")


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    if get_user_from_cookie(request):
        return RedirectResponse("/", status_code=302)
    return templates.TemplateResponse(request, "login.html")


@router.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    if get_user_from_cookie(request):
        return RedirectResponse("/", status_code=302)
    return templates.TemplateResponse(request, "register.html")


@router.get("/events/{event_id}", response_class=HTMLResponse)
def event_page(request: Request, event_id: int):
    return templates.TemplateResponse(request, "event.html", {"event_id": event_id})


@router.get("/my-tickets", response_class=HTMLResponse)
def tickets_page(request: Request):
    if not get_user_from_cookie(request):
        return RedirectResponse("/login?next=/my-tickets", status_code=302)
    return templates.TemplateResponse(request, "tickets.html")


@router.get("/admin", response_class=HTMLResponse)
def admin_page(request: Request):
    user = get_user_from_cookie(request)
    if not user:
        return RedirectResponse("/login?next=/admin", status_code=302)
    if user.role not in (UserRole.ADMIN, UserRole.GESTOR):
        return RedirectResponse("/", status_code=302)
    return templates.TemplateResponse(request, "admin.html")
