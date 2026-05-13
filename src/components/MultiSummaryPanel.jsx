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
          <div className="ship-metric-meta">Resumen agregado</div>
        </div>
        <span className={`tag tag-${isA ? 'blue' : 'coral'}`}>{shipName}</span>
      </div>
      <div className="ship-metric-list">{children}</div>
    </div>
  )
}

function formatAmmoSummary(avgRemaining, avgRemainingPct, totalRemaining) {
  const avgAmmo = Math.max(0, Math.round(Number(avgRemaining) || 0))
  const avgPct = Math.max(0, Math.round(Number(avgRemainingPct) || 0))
  const totalAmmo = Math.max(0, Math.round(Number(totalRemaining) || 0))
  return {
    value: `${avgAmmo}`,
    sub: `Media restante ${avgPct}% · total fin de tanda ${totalAmmo}`,
  }
}

function formatBlackoutSummary(avgG, avgMaxG) {
  const g = Number(avgG)
  const maxG = Number(avgMaxG)
  return {
    value: Number.isFinite(g) && g > 0 ? `${g.toFixed(1)} G` : '0.0 G',
    sub: Number.isFinite(maxG) && maxG > 0
      ? `Media en maniobra · pico medio ${maxG.toFixed(1)} G`
      : 'Sin carga G relevante',
  }
}

function formatOpportunityUseSummary(avgFireTime, avgDps, totalShots, totalHits, totalDmg) {
  return {
    value: `${Math.round(Number(totalDmg) || 0)} daño`,
    sub: `${(Number(avgDps) || 0).toFixed(1)} daño/s · ${(Number(avgFireTime) || 0).toFixed(1)}s disparando · ${Math.round(Number(totalShots) || 0)}/${Math.round(Number(totalHits) || 0)} disparos/impactos`,
  }
}

export function MultiSummaryPanel({ summary, shipAName, shipBName }) {
  if (!summary) return null

  const ammoA = summary.hasBallisticsA
    ? formatAmmoSummary(summary.avgAmmoRemainingA, summary.avgAmmoRemainingPctA, summary.totalAmmoRemainingA)
    : null
  const ammoB = summary.hasBallisticsB
    ? formatAmmoSummary(summary.avgAmmoRemainingB, summary.avgAmmoRemainingPctB, summary.totalAmmoRemainingB)
    : null
  const blackoutA = formatBlackoutSummary(summary.avgGForceA, summary.avgBlackoutMaxGA)
  const blackoutB = formatBlackoutSummary(summary.avgGForceB, summary.avgBlackoutMaxGB)
  const opportunityUseA = formatOpportunityUseSummary(summary.avgOpportunityFireTimeA, summary.avgOpportunityDpsA, summary.totalOpportunityShotsA, summary.totalOpportunityHitsA, summary.totalOpportunityDmgA)
  const opportunityUseB = formatOpportunityUseSummary(summary.avgOpportunityFireTimeB, summary.avgOpportunityDpsB, summary.totalOpportunityShotsB, summary.totalOpportunityHitsB, summary.totalOpportunityDmgB)
  const balanceLabel =
    summary.winsA === summary.winsB
      ? 'Igualado'
      : summary.winsA > summary.winsB
        ? `Ventaja ${shipAName}`
        : `Ventaja ${shipBName}`

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
          value={balanceLabel}
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
            label="Body medio restante"
            value={`${Math.round(summary.avgVitalPctA)}%`}
            sub="Qué tan cerca estuvo de morir"
          />
          <SummaryShipRow
            label="Hull medio restante"
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
          <SummaryShipRow
            label="Aprovechamiento medio"
            value={opportunityUseA.value}
            sub={opportunityUseA.sub}
          />
          <SummaryShipRow
            label="Fuerza G media"
            value={blackoutA.value}
            sub={blackoutA.sub}
          />
          {ammoA && (
            <SummaryShipRow
              label="Munición balística restante"
              value={ammoA.value}
              sub={ammoA.sub}
            />
          )}
          <SummaryShipRow
            label="Recargas de armas"
            value={summary.totalReloadsA}
            sub={`${(summary.totalReloadsA / summary.total).toFixed(1)} por combate`}
          />
        </SummaryShipColumn>

        <SummaryShipColumn side="b" shipName={shipBName}>
          <SummaryShipRow
            label="Victorias"
            value={summary.winsB}
            sub={`${Math.round((summary.winsB / summary.total) * 100)}% del total`}
          />
          <SummaryShipRow
            label="Body medio restante"
            value={`${Math.round(summary.avgVitalPctB)}%`}
            sub="Qué tan cerca estuvo de morir"
          />
          <SummaryShipRow
            label="Hull medio restante"
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
          <SummaryShipRow
            label="Aprovechamiento medio"
            value={opportunityUseB.value}
            sub={opportunityUseB.sub}
          />
          <SummaryShipRow
            label="Fuerza G media"
            value={blackoutB.value}
            sub={blackoutB.sub}
          />
          {ammoB && (
            <SummaryShipRow
              label="Munición balística restante"
              value={ammoB.value}
              sub={ammoB.sub}
            />
          )}
          <SummaryShipRow
            label="Recargas de armas"
            value={summary.totalReloadsB}
            sub={`${(summary.totalReloadsB / summary.total).toFixed(1)} por combate`}
          />
        </SummaryShipColumn>
      </div>
    </div>
  )
}
