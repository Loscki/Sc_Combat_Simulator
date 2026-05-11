/**
 * ShipCard.jsx
 * Muestra las estadísticas de una nave con barras visuales.
 * Recibe el objeto ship de ships.js y el lado ('a' | 'b').
 */

export function ShipCard({ ship, shipId, ships, side, onSelectShip }) {
  const isA    = side === 'a'
  const color  = isA ? '#378ADD' : '#D85A30'
  const shield = isA ? '#1D9E75' : '#EF9F27'

  const shipList = Object.values(ships).sort((s1, s2) => {
    const m = s1.manufacturer.localeCompare(s2.manufacturer)
    if (m !== 0) return m
    return s1.name.localeCompare(s2.name)
  })

  const grouped = shipList.reduce((acc, s) => {
    const key = s.manufacturer || 'Otros'
    acc[key] ??= []
    acc[key].push(s)
    return acc
  }, {})

  const bars = [
    { label: 'Casco',     value: ship.hullMax,    max: 1200,  pct: ship.hullMax / 1200,    col: color  },
    { label: 'Escudos',   value: ship.shieldMax,  max: 1300,  pct: ship.shieldMax / 1300,  col: shield },
    { label: 'Regen/s',   value: ship.shieldRegen,max: 100,   pct: ship.shieldRegen / 100, col: shield },
    { label: 'Precisión', value: `${Math.round(ship.accuracy * 100)}%`, pct: ship.accuracy, col: '#BA7517' },
    { label: 'Evasión',   value: `${Math.round(ship.evasion * 100)}%`,  pct: ship.evasion,  col: '#888780' },
  ]

  return (
    <div className="card">
      {/* Cabecera */}
      <div className="ship-header">
        <i className="ti ti-rocket" style={{ color }} aria-hidden="true" />
        <div className="ship-header-text">
          <span className="ship-name">{ship.name}</span>
          <span className="ship-meta">{ship.role} · {ship.weapons.join(', ')}</span>
        </div>
        <span className={`tag tag-${isA ? 'blue' : 'coral'}`}>{isA ? 'Alfa' : 'Beta'}</span>
      </div>

      <div className="ship-select-row" aria-label={`Selector de nave ${isA ? 'Alfa' : 'Beta'}`}>
        <select
          className="ship-select"
          value={shipId}
          onChange={(e) => onSelectShip(e.target.value)}
          aria-label={`Elegir nave para bando ${isA ? 'Alfa' : 'Beta'}`}
        >
          {Object.entries(grouped).map(([manufacturer, list]) => (
            <optgroup key={manufacturer} label={manufacturer}>
              {list.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.role} · DPS {s.dps}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* DPS destacado */}
      <div className="dps-badge" style={{ color }}>
        DPS {ship.dps}
      </div>

      {/* Barras de stats */}
      <div className="stat-list">
        {bars.map(({ label, value, pct, col }) => (
          <div key={label} className="stat-row">
            <span className="stat-label">{label}</span>
            <div className="bar-wrap">
              <div className="bar-fill" style={{ width: `${Math.min(pct * 100, 100)}%`, background: col }} />
            </div>
            <span className="stat-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
