/**
 * MultiSummaryPanel.jsx
 * Resumen agregado cuando se ejecutan múltiples simulaciones.
 */

function SummaryMetric({ label, value, sub }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-val">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

export function MultiSummaryPanel({ summary, shipAName, shipBName }) {
  if (!summary) return null

  return (
    <div className="results-panel">
      <div className="section-label">Resumen de {summary.total} simulaciones</div>

      <div className="metrics-grid">
        <SummaryMetric
          label="Victorias"
          value={`${summary.winsA} / ${summary.winsB}`}
          sub={`${shipAName} / ${shipBName}`}
        />
        <SummaryMetric
          label="Empates"
          value={summary.draws}
        />
        <SummaryMetric
          label="Duración media"
          value={`${Math.round(summary.avgDuration)}s`}
          sub={`${(summary.avgDuration / 60).toFixed(1)} min`}
        />
        <SummaryMetric
          label="HP medio restante"
          value={`${Math.round(summary.avgHullPctA)}% / ${Math.round(summary.avgHullPctB)}%`}
          sub={`${shipAName} / ${shipBName}`}
        />
      </div>

      <div className="metrics-grid">
        <SummaryMetric
          label={`DPS efectivo medio ${shipAName}`}
          value={summary.avgEffDpsA.toFixed(1)}
        />
        <SummaryMetric
          label={`DPS efectivo medio ${shipBName}`}
          value={summary.avgEffDpsB.toFixed(1)}
        />
        <SummaryMetric
          label="Total simulaciones"
          value={summary.total}
        />
        <SummaryMetric
          label="Balance"
          value={
            summary.winsA === summary.winsB
              ? 'Igualado'
              : summary.winsA > summary.winsB
                ? 'Ventaja Alfa'
                : 'Ventaja Beta'
          }
        />
      </div>
    </div>
  )
}

