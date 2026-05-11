/**
 * SimRunsSidebar.jsx
 * Lista lateral de simulaciones para seleccionar una run concreta.
 */

const WINNER_LABEL = {
  a: 'Gana Alfa',
  b: 'Gana Beta',
  draw: 'Empate',
}

export function SimRunsSidebar({ runs, selectedRunId, onSelectRun }) {
  if (!runs?.length) return null

  return (
    <div className="card runs-sidebar" aria-label="Lista de simulaciones">
      <div className="section-label">Simulaciones</div>
      <div className="runs-list" role="listbox" aria-label="Seleccionar simulación">
        {runs.map((r) => {
          const isActive = r.id === selectedRunId
          const winner = WINNER_LABEL[r.winner] ?? 'Resultado'
          const km = (Number(r.initialRangeM ?? r.initialRangeMUsed ?? 0) / 1000) || null
          return (
            <button
              key={r.id}
              type="button"
              className={`run-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectRun(r.id)}
              role="option"
              aria-selected={isActive}
            >
              <div className="run-item-top">
                <span className="run-title">Sim #{r.index}</span>
                <span className="run-duration">{Math.round(r.durationSec)}s</span>
              </div>
              <div className="run-winner">{winner}</div>
              {km && <div className="run-sub">{km.toFixed(1)} km</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

