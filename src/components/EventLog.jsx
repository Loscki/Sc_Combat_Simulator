/**
 * EventLog.jsx
 * Renderiza la lista de eventos destacados del combate.
 * Recibe el array events del resultado del motor.
 */

const SIDE_COLOR = {
  a:      '#378ADD',
  b:      '#D85A30',
  result: '#1D9E75',
}

export function EventLog({ events }) {
  if (!events?.length) return null

  return (
    <div className="card">
      <div className="section-label">Eventos del combate</div>
      <div className="event-list" role="log" aria-live="polite">
        {events.map((ev, i) => (
          <div key={i} className="event-row">
            <span className="event-time">{Math.round(ev.t)}s</span>
            <span
              className="event-dot"
              style={{ background: SIDE_COLOR[ev.side] ?? '#888780' }}
              aria-hidden="true"
            />
            <span className="event-text">{ev.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
