/**
 * ResultsPanel.jsx
 * Panel principal de resultados:
 *  - Hero con ganador
 *  - 4 métricas clave
 */

function MetricCard({ label, value, sub }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-val">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

const WINNER_TAG = {
  win:  { className: 'tag tag-win',  text: 'Ganador'  },
  draw: { className: 'tag tag-draw', text: 'Empate'   },
  loss: { className: 'tag tag-loss', text: 'Eliminado'},
}

function getTag(winner, side) {
  if (winner === 'draw') return WINNER_TAG.draw
  return winner === side ? WINNER_TAG.win : WINNER_TAG.loss
}

export function ResultsPanel({ result, onReset }) {
  const { winner, durationSec, stats, shipA, shipB, mergeCount, initialRangeMUsed, detection } = result
  const tagA = getTag(winner, 'a')
  const tagB = getTag(winner, 'b')

  const winnerName = winner === 'draw' ? 'Empate'
    : winner === 'a' ? shipA.name : shipB.name

  const sub = winner === 'draw'
    ? 'Diferencia menor al 5%'
    : `${Math.round(durationSec)}s de combate`

  return (
    <div className="results-panel">

      {/* Hero */}
      <div className="result-hero">
        <div className="result-side">
          <div className="result-ship-name">{shipA.name}</div>
          <span className={tagA.className}>{tagA.text}</span>
        </div>
        <div className="result-center">
          <div className="result-winner">{winnerName}</div>
          <div className="result-sub">{sub}</div>
        </div>
        <div className="result-side">
          <div className="result-ship-name">{shipB.name}</div>
          <span className={tagB.className}>{tagB.text}</span>
        </div>
      </div>

      {/* Métricas */}
      <div className="metrics-grid">
        <MetricCard
          label="Duración"
          value={`${Math.round(durationSec)}s`}
          sub={`${(durationSec / 60).toFixed(1)} min`}
        />
        <MetricCard
          label="Distancia inicial"
          value={`${((Number(initialRangeMUsed) || 0) / 1000).toFixed(1)} km`}
          sub="Inicio del combate"
        />
        <MetricCard
          label="Detección"
          value={`${((detection?.a?.rangeM ?? 0) / 1000).toFixed(1)} / ${((detection?.b?.rangeM ?? 0) / 1000).toFixed(1)} km`}
          sub={`${shipA.name} / ${shipB.name}`}
        />
        <MetricCard
          label="Merges"
          value={mergeCount ?? 0}
          sub="Cruces a 600m"
        />
        <MetricCard
          label={`DPS efectivo ${shipA.name}`}
          value={stats.a.effectiveDps}
          sub={`Teórico: ${stats.a.theoreticalDps}`}
        />
        <MetricCard
          label={`DPS efectivo ${shipB.name}`}
          value={stats.b.effectiveDps}
          sub={`Teórico: ${stats.b.theoreticalDps}`}
        />
        <MetricCard
          label="Disparos"
          value={`${stats.a.shotsFired} / ${stats.b.shotsFired}`}
          sub={`${shipA.name} / ${shipB.name}`}
        />
        <MetricCard
          label="Impactos"
          value={`${stats.a.hits} / ${stats.b.hits}`}
          sub={`${stats.a.hitPct}% / ${stats.b.hitPct}% acierto`}
        />
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="Casco restante"
          value={`${stats.a.hullPct}% / ${stats.b.hullPct}%`}
          sub={`Hasta destrucción · HP+escudo: ${stats.a.totalHpPct}% / ${stats.b.totalHpPct}%`}
        />
      </div>

      {/* Acciones */}
      <div className="result-actions">
        <button onClick={onReset}>
          <i className="ti ti-refresh" aria-hidden="true" /> Nueva simulación
        </button>
      </div>

    </div>
  )
}
