/**
 * ShotLog.jsx
 * Detalle por segundo: disparos, impactos y daño, incluyendo rango.
 */

export function ShotLog({ shots, shipAName, shipBName }) {
  if (!shots?.length) return null

  return (
    <div className="card">
      <div className="section-label">Detalle de disparos (por segundo)</div>
      <div className="shot-list" role="log" aria-live="polite">
        {shots.map((s) => (
          <div key={s.t} className="shot-row">
            <span className="shot-time">{s.t}s</span>
            <span className="shot-range">{(s.rangeM / 1000).toFixed(2)} km</span>
            <span className="shot-side shot-a">
              {shipAName}: {s.a.hits}/{s.a.shots} · {s.a.dmg} dmg
            </span>
            <span className="shot-side shot-b">
              {shipBName}: {s.b.hits}/{s.b.shots} · {s.b.dmg} dmg
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

