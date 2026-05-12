/**
 * ResultsPanel.jsx
 * Panel de lectura del combate:
 *  - Hero con resultado
 *  - Contexto global mínimo
 *  - Dos columnas con métricas clave por nave
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

function ShipMetricRow({ label, value, sub }) {
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

function ShipMetricColumn({ side, ship, tag, children }) {
  return (
    <div className={`ship-metric-column ship-metric-${side}`}>
      <div className="ship-metric-header">
        <div>
          <div className="ship-metric-title">{ship.name}</div>
          <div className="ship-metric-meta">{ship.manufacturer}</div>
        </div>
        <span className={tag.className}>{tag.text}</span>
      </div>
      <div className="ship-metric-list">{children}</div>
    </div>
  )
}

const WINNER_TAG = {
  win:  { className: 'tag tag-win',  text: 'Ganador' },
  draw: { className: 'tag tag-draw', text: 'Empate' },
  loss: { className: 'tag tag-loss', text: 'Derrotado' },
}

function getTag(winner, side) {
  if (winner === 'draw') return WINNER_TAG.draw
  return winner === side ? WINNER_TAG.win : WINNER_TAG.loss
}

function formatHpLine(current, max) {
  const currentValue = Math.max(0, Math.round(Number(current) || 0))
  const maxValue = Math.max(0, Math.round(Number(max) || 0))
  return `${currentValue}/${maxValue} HP`
}

function formatDetection(result, side) {
  if (result.mode === 'static') {
    return {
      value: `${(Number(result.initialRangeMUsed || 0) / 1000).toFixed(1)} km`,
      sub: 'Modo estático sin fase de detección',
    }
  }

  const detection = result.detection?.[side]
  return {
    value: `${((Number(detection?.rangeM) || 0) / 1000).toFixed(1)} km`,
    sub: detection?.readyAtSec != null
      ? `Listo para responder en ${detection.readyAtSec.toFixed(1)}s`
      : 'Sincronización de sensores',
  }
}

function formatOpportunity(stats) {
  return {
    value: `${stats.opportunityUptimePct}%`,
    sub: `${stats.opportunityTimeSec}s con ventana de tiro`,
  }
}

function formatShots(stats) {
  return {
    value: `${stats.shotsFired} / ${stats.hits}`,
    sub: `${stats.hitPct}% de acierto`,
  }
}

function formatAverageDamage(stats) {
  return {
    value: stats.avgDamagePerHit,
    sub: `${stats.avgDamagePerShot} por disparo`,
  }
}

function formatTotalDamage(stats) {
  return {
    value: stats.totalDmgDealt,
    sub: `Escudo ${stats.shieldDmgDealt} · Hull ${stats.hullDmgDealt} · Body ${stats.vitalDmgDealt}`,
  }
}

function formatBallisticAmmo(stats) {
  const remaining = Math.max(0, Math.round(Number(stats.ammoRemaining) || 0))
  const pct = Math.max(0, Math.round(Number(stats.ammoRemainingPct) || 0))
  return {
    value: remaining,
    sub: `${pct}% restante al final`,
  }
}

function formatWeaponReloads(stats) {
  const reloads = Math.max(0, Math.round(Number(stats.weaponReloads) || 0))
  return {
    value: reloads,
    sub: reloads === 1 ? '1 recarga durante el combate' : `${reloads} recargas durante el combate`,
  }
}

function lethalityScore(attackerStats, defenderStats) {
  if ((Number(defenderStats?.vitalPct) || 0) <= 0) {
    return { value: '100', sub: 'Body rival destruido' }
  }

  const bodyProgress = 100 - (Number(defenderStats?.vitalPct) || 0)
  const hullProgress = 100 - (Number(defenderStats?.hullPct) || 0)
  const shieldProgress = (Number(defenderStats?.shieldPct) || 0) <= 0
    ? 100
    : Math.max(0, 100 - (Number(defenderStats?.shieldPct) || 0))
  const shieldBreakPressure = Math.min(100, (Number(defenderStats?.shieldDowns) || 0) * 35)

  const score = Math.round(
    bodyProgress * 0.55 +
    hullProgress * 0.20 +
    shieldProgress * 0.10 +
    shieldBreakPressure * 0.15
  )

  return {
    value: String(Math.min(100, Math.max(0, score))),
    sub: `${bodyProgress}% progreso sobre Body rival`,
  }
}

function formatShieldBreaks(stats) {
  const count = Number(stats.shieldDowns) || 0
  return {
    value: count,
    sub: count === 1 ? '1 vez a 0' : `${count} veces a 0`,
  }
}

function overviewLabel(result) {
  if (result.mode === 'static') return 'Banco estático'
  return result.winner === 'draw' ? 'Tiempo agotado' : 'Desenlace'
}

function overviewValue(result) {
  if (result.mode === 'static') return 'Frente a frente'
  if (result.winner === 'draw') return 'Sin destrucción'
  return result.winner === 'a' ? result.shipA.name : result.shipB.name
}

export function ResultsPanel({ result, onReset }) {
  const { winner, durationSec, stats, shipA, shipB, initialRangeMUsed } = result
  const tagA = getTag(winner, 'a')
  const tagB = getTag(winner, 'b')

  const winnerName = winner === 'draw'
    ? 'Empate'
    : winner === 'a' ? shipA.name : shipB.name

  const sub = winner === 'draw'
    ? 'No hubo destrucción en el tiempo simulado'
    : `${Math.round(durationSec)}s de combate`

  const detectionA = formatDetection(result, 'a')
  const detectionB = formatDetection(result, 'b')
  const opportunityA = formatOpportunity(stats.a)
  const opportunityB = formatOpportunity(stats.b)
  const shotsA = formatShots(stats.a)
  const shotsB = formatShots(stats.b)
  const avgDamageA = formatAverageDamage(stats.a)
  const avgDamageB = formatAverageDamage(stats.b)
  const totalDamageA = formatTotalDamage(stats.a)
  const totalDamageB = formatTotalDamage(stats.b)
  const lethalityA = lethalityScore(stats.a, stats.b)
  const lethalityB = lethalityScore(stats.b, stats.a)
  const shieldBreaksA = formatShieldBreaks(stats.a)
  const shieldBreaksB = formatShieldBreaks(stats.b)
  const ammoA = Number(stats.a.ballisticWeaponCount) > 0 ? formatBallisticAmmo(stats.a) : null
  const ammoB = Number(stats.b.ballisticWeaponCount) > 0 ? formatBallisticAmmo(stats.b) : null
  const reloadsA = formatWeaponReloads(stats.a)
  const reloadsB = formatWeaponReloads(stats.b)

  return (
    <div className="results-panel">
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

      <div className="metrics-grid metrics-overview">
        <MetricCard
          label="Duración"
          value={`${Math.round(durationSec)}s`}
          sub={`${(durationSec / 60).toFixed(1)} min`}
        />
        <MetricCard
          label="Distancia inicial"
          value={`${((Number(initialRangeMUsed) || 0) / 1000).toFixed(1)} km`}
          sub="Separación al inicio"
        />
        <MetricCard
          label={overviewLabel(result)}
          value={overviewValue(result)}
          sub={winner === 'draw' ? 'Ventaja por daño/estado final' : 'Resultado del enfrentamiento'}
        />
      </div>

      <div className="ship-metrics-grid">
        <ShipMetricColumn side="a" ship={shipA} tag={tagA}>
          <ShipMetricRow label="Detección" value={detectionA.value} sub={detectionA.sub} />
          <ShipMetricRow
            label="Body restante"
            value={`${stats.a.vitalPct}%`}
            sub={formatHpLine(stats.a.vitalRemaining, shipA.vitalHullMax)}
          />
          <ShipMetricRow
            label="Hull restante"
            value={`${stats.a.hullPct}%`}
            sub={formatHpLine(stats.a.hullRemaining, shipA.hullMax)}
          />
          <ShipMetricRow
            label="Escudo a 0"
            value={shieldBreaksA.value}
            sub={shieldBreaksA.sub}
          />
          <ShipMetricRow
            label="Ventana de oportunidad"
            value={opportunityA.value}
            sub={opportunityA.sub}
          />
          <ShipMetricRow
            label="Disparos / impactos"
            value={shotsA.value}
            sub={shotsA.sub}
          />
          <ShipMetricRow
            label="Daño medio"
            value={avgDamageA.value}
            sub={avgDamageA.sub}
          />
          <ShipMetricRow
            label="Daño total"
            value={totalDamageA.value}
            sub={totalDamageA.sub}
          />
          {ammoA && (
            <ShipMetricRow
              label="Munición balística restante"
              value={ammoA.value}
              sub={ammoA.sub}
            />
          )}
          <ShipMetricRow
            label="Recargas de armas"
            value={reloadsA.value}
            sub={reloadsA.sub}
          />
          <ShipMetricRow
            label="Letalidad"
            value={lethalityA.value}
            sub={lethalityA.sub}
          />
        </ShipMetricColumn>

        <ShipMetricColumn side="b" ship={shipB} tag={tagB}>
          <ShipMetricRow label="Detección" value={detectionB.value} sub={detectionB.sub} />
          <ShipMetricRow
            label="Body restante"
            value={`${stats.b.vitalPct}%`}
            sub={formatHpLine(stats.b.vitalRemaining, shipB.vitalHullMax)}
          />
          <ShipMetricRow
            label="Hull restante"
            value={`${stats.b.hullPct}%`}
            sub={formatHpLine(stats.b.hullRemaining, shipB.hullMax)}
          />
          <ShipMetricRow
            label="Escudo a 0"
            value={shieldBreaksB.value}
            sub={shieldBreaksB.sub}
          />
          <ShipMetricRow
            label="Ventana de oportunidad"
            value={opportunityB.value}
            sub={opportunityB.sub}
          />
          <ShipMetricRow
            label="Disparos / impactos"
            value={shotsB.value}
            sub={shotsB.sub}
          />
          <ShipMetricRow
            label="Daño medio"
            value={avgDamageB.value}
            sub={avgDamageB.sub}
          />
          <ShipMetricRow
            label="Daño total"
            value={totalDamageB.value}
            sub={totalDamageB.sub}
          />
          {ammoB && (
            <ShipMetricRow
              label="Munición balística restante"
              value={ammoB.value}
              sub={ammoB.sub}
            />
          )}
          <ShipMetricRow
            label="Recargas de armas"
            value={reloadsB.value}
            sub={reloadsB.sub}
          />
          <ShipMetricRow
            label="Letalidad"
            value={lethalityB.value}
            sub={lethalityB.sub}
          />
        </ShipMetricColumn>
      </div>

      <div className="result-actions">
        <button className="result-floating-action" onClick={onReset}>
          <i className="ti ti-refresh" aria-hidden="true" /> Nueva simulación
        </button>
      </div>
    </div>
  )
}
