export default function Footer() {
  return (
    <footer className="footer">
      <div className="container d-flex flex-wrap justify-content-between align-items-center">
        <span>🎟️ Entradas — Venta de entradas de eventos</span>
        <span>
          Teatro · Cine · Conciertos · Deportes ·{' '}
          <a href="/docs" target="_blank" rel="noreferrer">
            API Docs
          </a>
        </span>
      </div>
    </footer>
  )
}
