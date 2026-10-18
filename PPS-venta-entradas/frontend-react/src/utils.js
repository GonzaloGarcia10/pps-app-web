export const EVENT_ICONS = {
  cine: '🎬',
  teatro: '🎭',
  concierto: '🎵',
  deporte: '🏆',
  congreso: '💼',
  otro: '🎟️',
}

export const EVENT_LABELS = {
  all: 'Todos',
  cine: 'Cine',
  teatro: 'Teatro',
  concierto: 'Conciertos',
  deporte: 'Deportes',
  congreso: 'Congresos',
  otro: 'Otros',
}

export const EVENT_TYPES = ['cine', 'teatro', 'concierto', 'deporte', 'congreso', 'otro']

export const USER_ROLES = ['admin', 'gestor', 'cliente']

export const ROLE_LABELS = {
  admin: 'Administrador',
  gestor: 'Gestor',
  cliente: 'Cliente',
}

export function canManage(user) {
  return user?.role === 'admin' || user?.role === 'gestor'
}

export const STATUS_STYLES = {
  reservado: { cls: 'bg-warning text-dark', label: 'Reservado' },
  confirmado: { cls: 'bg-success', label: 'Confirmado' },
  cancelado: { cls: 'bg-secondary', label: 'Cancelado' },
  usado: { cls: 'bg-dark', label: 'Usado' },
}

export function formatPrice(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0)
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
