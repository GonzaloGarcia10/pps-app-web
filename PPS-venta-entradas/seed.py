"""Script para poblar la base de datos con datos de ejemplo y un usuario admin.

Es idempotente: si volvés a ejecutarlo, agrega solo lo que falte (por nombre/título).
Los eventos se generan relativos a "hoy", así que siempre quedan en el futuro.
"""
from datetime import datetime, timedelta

from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.models.event import Event, EventType
from app.models.seat import Seat


VENUES = [
    # (nombre, dirección, ciudad, capacidad, descripción)
    ("Teatro Real", "Plaza de Oriente s/n", "Madrid", 1746,
     "Coliseo de ópera y teatro clásico en el corazón de Madrid."),
    ("Palacio de la Prensa", "Plaza del Callao 4", "Madrid", 400,
     "Cine histórico con estrenos y ciclos de autor."),
    ("Auditorio Nacional", "Calle del Príncipe de Vergara 146", "Madrid", 2300,
     "Sala sinfónica de referencia para conciertos y recitales."),
    ("Estadio Metropolitano", "Av. de Luis Aragonés 4", "Madrid", 68000,
     "Estadio de fútbol para partidos de liga y eventos deportivos."),
    ("Palau Sant Jordi", "Passeig Olímpic 5-7", "Barcelona", 17000,
     "Pabellón multiusos para conciertos y grandes espectáculos."),
    ("Cinesa Diagonal", "Av. Diagonal 3", "Barcelona", 500,
     "Multicine con las últimas novedades de cartelera."),
    ("IFEMA Madrid", "Av. del Partenón 5", "Madrid", 30000,
     "Recinto ferial para congresos, ferias y convenciones."),
]

# (título, tipo, días desde hoy, hora, precio €, índice venue, descripción)
EVENTS = [
    # --- Teatro ---
    ("Hamlet", EventType.TEATRO, 3, 20, 38.50, 0,
     "El clásico de Shakespeare en un montaje contemporáneo."),
    ("El Rey León", EventType.TEATRO, 5, 19, 45.00, 0,
     "El musical de Disney lleno de color, música y marionetas."),
    ("La Casa de Bernarda Alba", EventType.TEATRO, 9, 20, 28.00, 0,
     "El drama de Federico García Lorca sobre el luto y la represión."),
    ("Mamma Mia!", EventType.TEATRO, 14, 21, 39.90, 0,
     "El musical con los grandes éxitos de ABBA."),

    # --- Cine ---
    ("Dune: Parte Tres", EventType.CINE, 2, 19, 11.50, 1,
     "El desenlace de la saga épica de ciencia ficción."),
    ("Estreno Sci-Fi: Órbita", EventType.CINE, 4, 18, 10.90, 1,
     "Thriller espacial sobre una misión al borde del sistema solar."),
    ("Ciclo Kubrick: 2001", EventType.CINE, 8, 20, 9.50, 1,
     "Proyección del clásico 2001: Una odisea del espacio."),
    ("Festival de Cine de Autor", EventType.CINE, 12, 17, 12.00, 5,
     "Selección de películas independientes internacionales."),

    # --- Conciertos ---
    ("Concierto Sinfónico de Primavera", EventType.CONCIERTO, 6, 20, 55.00, 2,
     "La orquesta sinfónica interpreta a Beethoven y Brahms."),
    ("Noche de Jazz", EventType.CONCIERTO, 10, 21, 35.00, 2,
     "Una velada íntima con cuarteto de jazz y voz."),
    ("Festival Indie Nights", EventType.CONCIERTO, 16, 19, 65.00, 4,
     "Cinco bandas indie nacionales en una sola noche."),
    ("Rock en Vivo", EventType.CONCIERTO, 21, 21, 48.00, 4,
     "Las guitarras más potentes del rock en directo."),
    ("Ópera: La Traviata", EventType.CONCIERTO, 28, 19, 89.00, 0,
     "La obra de Verdi con reparto internacional."),

    # --- Deporte ---
    ("Derbi de Liga", EventType.DEPORTE, 7, 21, 95.00, 3,
     "El clásico local que paraliza la ciudad."),
    ("Final de Copa", EventType.DEPORTE, 18, 20, 75.00, 3,
     "El partido más esperado de la temporada."),
    ("Torneo de Tenis Masters", EventType.DEPORTE, 24, 16, 60.00, 3,
     "Cuadro final con las mejores raquetas del circuito."),
    ("Playoffs de Baloncesto", EventType.DEPORTE, 30, 20, 42.00, 4,
     "Semifinales de la liga de baloncesto."),

    # --- Congresos ---
    ("Tech Summit 2026", EventType.CONGRESO, 11, 9, 249.00, 6,
     "El encuentro anual de tecnología, IA y desarrollo."),
    ("Congreso de Medicina", EventType.CONGRESO, 20, 10, 320.00, 6,
     "Ponencias y talleres para profesionales de la salud."),
    ("Startup Weekend", EventType.CONGRESO, 26, 9, 89.00, 6,
     "48 horas para validar tu idea y crear un producto."),

    # --- Otro ---
    ("Comedia Stand-Up", EventType.OTRO, 1, 22, 22.00, 0,
     "Risas garantizadas con los monologuistas del momento."),
    ("Espectáculo de Magia", EventType.OTRO, 13, 19, 30.00, 0,
     "Ilusionismo en vivo para toda la familia."),
    ("Circo del Sol", EventType.OTRO, 22, 20, 55.00, 4,
     "Acrobacias y puesta en escena de talla internacional."),
]

# Asientos por evento (se reparten en filas de 12)
SEATS_PER_ROW = 12
MAX_SEATS = 120


def _create_seats(db, event, venue, price):
    total = min(venue.capacity, MAX_SEATS)
    created = 0
    row_index = 0
    while created < total:
        row = chr(ord("A") + row_index)
        for num in range(1, SEATS_PER_ROW + 1):
            if created >= total:
                break
            db.add(Seat(event_id=event.id, row=row, number=num,
                        price=price, is_available=True))
            created += 1
        row_index += 1
    db.commit()
    return created


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Usuarios de ejemplo (uno por rol)
        users = [
            ("admin", "admin@example.com", "Administrador", "admin123", UserRole.ADMIN),
            ("gestor", "gestor@example.com", "Gestor de Eventos", "gestor123", UserRole.GESTOR),
            ("cliente", "cliente@example.com", "Cliente de Prueba", "cliente123", UserRole.CLIENTE),
        ]
        for username, email, full_name, password, role in users:
            if not db.query(User).filter(User.username == username).first():
                db.add(User(
                    email=email,
                    username=username,
                    full_name=full_name,
                    hashed_password=get_password_hash(password),
                    is_active=True,
                    role=role,
                ))
                db.commit()
                print(f"Usuario {role.value} creado -> usuario: {username} / contraseña: {password}")

        # Recintos
        venues = []
        for name, address, city, capacity, description in VENUES:
            venue = db.query(Venue).filter(Venue.name == name).first()
            if not venue:
                venue = Venue(name=name, address=address, city=city,
                              capacity=capacity, description=description)
                db.add(venue)
                db.commit()
                db.refresh(venue)
            venues.append(venue)
        print(f"Recintos: {len(venues)}")

        # Eventos
        now = datetime.now()
        created_events = 0
        created_seats = 0
        for title, etype, days, hour, price, venue_idx, description in EVENTS:
            if db.query(Event).filter(Event.title == title).first():
                continue
            start = (now + timedelta(days=days)).replace(
                hour=hour, minute=0, second=0, microsecond=0)
            event = Event(title=title, description=description, event_type=etype,
                          start_time=start, end_time=start + timedelta(hours=2),
                          venue_id=venues[venue_idx].id, base_price=price)
            db.add(event)
            db.commit()
            db.refresh(event)
            created_events += 1
            created_seats += _create_seats(db, event, venues[venue_idx], price)

        print(f"Eventos creados: {created_events} | Asientos creados: {created_seats}")
        print("Listo.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
