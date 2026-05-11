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

function SummaryShipRow({ label, value, sub }) {
  return (
    <div className="ship-metric-row">
      <div>
        <div className="ship-metric-label">{label}</div>
        {sub && <div className="ship-metric-sub">{sub}</div>}
      </div>
      <div className="ship-metric-value">{value}</div>
    </div>
  )
}

function SummaryShipColumn({ side, shipName, children }) {
  const isA = side === 'a'
  return (
    <div className={`ship-metric-column ship-metric-${side}`}>
      <div className="ship-metric-header">
        <div>
          <div className="ship-metric-title">{shipName}</div>
          <div className="ship-metric-meta">{isA ? 'Alfa' : 'Beta'}</div>
        </div>
        <span className={`tag tag-${isA ? 'blue' : 'coral'}`}>{isA ? 'Alfa' : 'Beta'}</span>
      </div>
      <div className="ship-metric-list">{children}</div>
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
          label="Empates"
          value={summary.draws}
        />
        <SummaryMetric
          label="Duración media"
          value={`${Math.round(summary.avgDuration)}s`}
          sub={`${(summary.avgDuration / 60).toFixed(1)} min`}
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
        <SummaryMetric
          label="Total simulaciones"
          value={summary.total}
        />
      </div>

      <div className="ship-metrics-grid">
        <SummaryShipColumn side="a" shipName={shipAName}>
          <SummaryShipRow
            label="Victorias"
            value={summary.winsA}
            sub={`${Math.round((summary.winsA / summary.total) * 100)}% del total`}
          />
          <SummaryShipRow
            label="Casco medio restante"
            value={`${Math.round(summary.avgHullPctA)}%`}
            sub={`Hasta destrucción · HP+escudo: ${Math.round(summary.avgTotalHpPctA)}%`}
          />
          <SummaryShipRow
            label="DPS efectivo medio"
            value={summary.avgEffDpsA.toFixed(1)}
          />
          <SummaryShipRow
            label="Ventana de fuego media"
            value={`${Math.round(summary.avgFireUptimeA)}%`}
            sub={`Capacitor medio: ${Math.round(summary.avgWeaponCapA)}%`}
          />
        </SummaryShipColumn>

        <SummaryShipColumn side="b" shipName={shipBName}>
          <SummaryShipRow
            label="Victorias"
            value={summary.winsB}
            sub={`${Math.round((summary.winsB / summary.total) * 100)}% del total`}
          />
          <SummaryShipRow
            label="Casco medio restante"
            value={`${Math.round(summary.avgHullPctB)}%`}
            sub={`Hasta destrucción · HP+escudo: ${Math.round(summary.avgTotalHpPctB)}%`}
          />
          <SummaryShipRow
            label="DPS efectivo medio"
            value={summary.avgEffDpsB.toFixed(1)}
          />
          <SummaryShipRow
            label="Ventana de fuego media"
            value={`${Math.round(summary.avgFireUptimeB)}%`}
            sub={`Capacitor medio: ${Math.round(summary.avgWeaponCapB)}%`}
          />
        </SummaryShipColumn>
      </div>
    </div>
  )
}
