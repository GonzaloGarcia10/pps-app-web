# Venta de Entradas — Backend + Frontend

Aplicación completa (API REST + interfaz web) desarrollada con FastAPI para la gestión y venta de entradas de eventos: teatro, cine, conciertos, deportes, congresos y más.

## Características

- Backend REST con FastAPI y SQLAlchemy
- Frontend server-rendered (Jinja2) con Bootstrap 5 y JavaScript
- SPA opcional en React (Vite + React Router) en `frontend-react/`, consume la misma API
- Autenticación JWT (registro y login de usuarios), tanto para la API (header `Authorization: Bearer`) como para el frontend (cookie `HttpOnly`)
- Páginas del frontend protegidas del lado del servidor (`/my-tickets`, `/admin`)
- Gestión de recintos (venues), eventos y asientos
- Compra y gestión de tickets en línea
- Estados de tickets: reservado, confirmado, cancelado, usado
- Tipos de eventos: cine, teatro, concierto, deporte, congreso, otro
- Panel de administración web para crear recintos, eventos y asientos

## Instalación

```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
pip install -r requirements.txt
```

## Poblar con datos de ejemplo

```bash
python seed.py
```

Esto crea:
- Usuario administrador → **usuario: `admin` / contraseña: `admin123`**
- 7 recintos en Madrid y Barcelona (teatros, cines, auditorios, estadio y recinto ferial)
- 22 eventos próximos (teatro, cine, conciertos, deporte, congresos y otros) con precios realistas en euros
- Asientos de ejemplo para cada evento

El script es **idempotente**: si lo volvés a ejecutar, agrega solo lo que falte. Los eventos se
generan relativos a la fecha actual, por lo que siempre quedan en el futuro.

## Ejecución

```bash
uvicorn app.main:app --reload
```

Disponible en:

| URL | Descripción |
|---|---|
| `http://localhost:8000/` | Frontend — listado de eventos |
| `http://localhost:8000/login` | Inicio de sesión |
| `http://localhost:8000/register` | Registro de usuarios |
| `http://localhost:8000/my-tickets` | Mis tickets |
| `http://localhost:8000/admin` | Panel de administración (solo admin) |
| `http://localhost:8000/docs` | Documentación interactiva (Swagger UI) |
| `http://localhost:8000/redoc` | Documentación ReDoc |

## Estructura del Proyecto

```
app/
├── api/
│   ├── deps.py              # Dependencias (auth, db)
│   └── v1/
│       ├── auth.py          # Autenticación y registro
│       ├── venues.py        # Recintos
│       ├── events.py        # Eventos
│       ├── seats.py         # Asientos
│       ├── tickets.py       # Tickets/Compras
│       └── api.py           # Router principal
├── core/
│   ├── config.py            # Configuración
│   └── security.py          # JWT y encriptación
├── db/
│   ├── base.py              # Base SQLAlchemy
│   └── session.py           # Sesión DB
├── models/                  # Modelos SQLAlchemy
├── schemas/                 # Esquemas Pydantic
├── web.py                   # Rutas del frontend (Jinja2)
└── main.py                  # Aplicación principal
frontend/
├── templates/               # Plantillas HTML (Jinja2)
└── static/
    ├── css/style.css
    └── js/                  # Lógica del frontend
frontend-react/              # SPA opcional en React (Vite)
tests/                       # Tests con pytest
seed.py                      # Script de datos de ejemplo
```

## Endpoints principales

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | `/health` | Health check | No |
| POST | `/api/v1/auth/register` | Registrar usuario | No |
| POST | `/api/v1/auth/login` | Login (OAuth2) | No |
| POST | `/api/v1/auth/logout` | Cerrar sesión (borra cookie) | No |
| GET | `/api/v1/auth/me` | Usuario actual | Usuario |
| GET | `/api/v1/venues/` | Listar recintos | No |
| POST | `/api/v1/venues/` | Crear recinto | Admin |
| GET | `/api/v1/events/` | Listar eventos | No |
| GET | `/api/v1/events/{id}` | Obtener evento | No |
| POST | `/api/v1/events/` | Crear evento | Admin |
| GET | `/api/v1/seats/event/{id}/available` | Asientos disponibles | No |
| POST | `/api/v1/seats/bulk` | Crear asientos en lote | Admin |
| POST | `/api/v1/tickets/purchase` | Comprar ticket | Usuario |
| GET | `/api/v1/tickets/my-tickets` | Mis tickets | Usuario |
| PUT | `/api/v1/tickets/{id}/confirm` | Confirmar ticket | Usuario |
| PUT | `/api/v1/tickets/{id}/cancel` | Cancelar ticket | Usuario |
| DELETE | `/api/v1/tickets/{id}` | Eliminar ticket cancelado | Usuario |

## Autenticación

La app usa **JWT** en dos modalidades:

- **API / Swagger / tests**: header `Authorization: Bearer <token>`.
- **Frontend**: el login guarda el JWT en una **cookie `HttpOnly`** (`access_token`), que el
  navegador envía automáticamente. JavaScript no puede leer el token (mitiga XSS).

Rutas del frontend protegidas **del lado del servidor** (`app/web.py`):

- `/my-tickets` → si no hay sesión, redirige a `/login?next=/my-tickets`.
- `/admin` → si no hay sesión redirige a `/login?next=/admin`; si el usuario no es admin, redirige a `/`.

El logout (`POST /api/v1/auth/logout`) elimina la cookie.

## Uso del frontend

1. Ejecutar `python seed.py` y luego `uvicorn app.main:app --reload`.
2. Abrir `http://localhost:8000`.
3. Iniciar sesión como `admin` / `admin123` para crear recintos, eventos y asientos desde el panel **Admin**.
4. Registrarse como usuario normal para comprar entradas desde la página de cada evento.

## Frontend React (SPA)

Además del frontend Jinja (server-rendered) descrito arriba, el proyecto incluye una **SPA en React**
en `frontend-react/` (Vite + React + React Router + Bootstrap). Consume la misma API y usa la misma
cookie `HttpOnly` para la sesión.

### Requisitos
- Node.js 18+ y npm

### Desarrollo

1. Levantá el backend en el puerto 8000:
   ```bash
   uvicorn app.main:app --reload
   ```
2. En otra terminal, instalá dependencias y arrancá Vite (puerto 5173):
   ```bash
   cd frontend-react
   npm install
   npm run dev
   ```
3. Abrí `http://localhost:5173`.

Vite hace **proxy** de `/api` hacia `http://127.0.0.1:8000`, así que las cookies de sesión viajan
como mismo origen (no hay problemas de CORS).

### Build de producción

```bash
cd frontend-react
npm run build      # genera dist/
npm run preview    # sirve dist/ para probar
```

### Estructura

```
frontend-react/
├── index.html
├── vite.config.js        # proxy /api → backend
└── src/
    ├── main.jsx          # punto de entrada
    ├── App.jsx           # rutas (React Router)
    ├── api.js            # apiFetch / apiJson (cookies)
    ├── auth.jsx          # AuthContext (/auth/me, login, logout)
    ├── utils.js          # formatos € y fecha, iconos
    ├── style.css         # estilos (compartidos con el frontend Jinja)
    ├── components/       # Navbar, Footer, Layout, EventCard, ProtectedRoute
    └── pages/            # Home, EventDetail, MyTickets, Admin, Login, Register, NotFound
```

## Uso de la API (curl)

```bash
# Registro
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"test123"}'

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=test123"

# Comprar un ticket (usar el token del login)
curl -X POST "http://localhost:8000/api/v1/tickets/purchase" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"seat_id":1}'
```

## Tests

```bash
pytest -v
```
