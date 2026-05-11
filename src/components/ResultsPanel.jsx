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
  win:  { className: 'tag tag-win',  text: 'Ganador'  },
  draw: { className: 'tag tag-draw', text: 'Empate'   },
  loss: { className: 'tag tag-loss', text: 'Eliminado'},
}

function getTag(winner, side) {
  if (winner === 'draw') return WINNER_TAG.draw
  return winner === side ? WINNER_TAG.win : WINNER_TAG.loss
}

function sourceLabel(source) {
  if (source === 'real') return 'datos reales'
  if (source === 'mixed') return 'real + fallback'
  return 'fallback mock'
}

function formatDamageTypes(types) {
  const entries = Object.entries(types ?? {}).filter(([, value]) => Number(value) > 0)
  if (entries.length === 0) return 'Sin daño registrado'
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([type, value]) => `${type}: ${Math.round(value)}`)
    .join(' · ')
}

function formatAmmo(stats) {
  if (!stats.ammoCapacity) return { value: '∞', sub: 'Sin munición finita' }
  return {
    value: `${stats.ammoRemainingPct}%`,
    sub: `${stats.ammoRemaining}/${stats.ammoCapacity} restante · seco: ${stats.ammoDryPct}%`,
  }
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
  const ammoA = formatAmmo(stats.a)
  const ammoB = formatAmmo(stats.b)

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

      {/* Métricas globales */}
      <div className="metrics-grid metrics-overview">
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
          label="Merges"
          value={mergeCount ?? 0}
          sub="Cruces a 600m"
        />
      </div>

      {/* Métricas por nave */}
      <div className="ship-metrics-grid">
        <ShipMetricColumn side="a" ship={shipA} tag={tagA}>
          <ShipMetricRow
            label="Detección"
            value={`${((detection?.a?.rangeM ?? 0) / 1000).toFixed(1)} km`}
            sub="Rango efectivo"
          />
          <ShipMetricRow
            label="DPS efectivo"
            value={stats.a.effectiveDps}
            sub={`Teórico sim: ${stats.a.theoreticalDps} · raw armas: ${stats.a.rawWeaponDps}`}
          />
          <ShipMetricRow
            label="Banco de armas"
            value={stats.a.weaponCapCapacity}
            sub={`${sourceLabel(stats.a.weaponDataSource)} · ${stats.a.weaponCount} armas · recarga ${stats.a.weaponCapRegen}/s · consumo ${stats.a.weaponCapDrain}/s`}
          />
          <ShipMetricRow
            label="Munición"
            value={ammoA.value}
            sub={ammoA.sub}
          />
          <ShipMetricRow
            label="Disparos"
            value={stats.a.shotsFired}
            sub={`${stats.a.hits} impactos`}
          />
          <ShipMetricRow
            label="Impactos"
            value={stats.a.hits}
            sub={`${stats.a.hitPct}% acierto`}
          />
          <ShipMetricRow
            label="Daño infligido"
            value={stats.a.totalDmgDealt}
            sub={`${formatDamageTypes(stats.a.damageByType)} · escudo ${stats.a.shieldDmgDealt} · casco ${stats.a.hullDmgDealt}`}
          />
          <ShipMetricRow
            label="Ventana de fuego"
            value={`${stats.a.fireUptimePct}%`}
            sub={`${stats.a.fireTimeSec}s disparando`}
          />
          <ShipMetricRow
            label="Capacitor medio"
            value={`${stats.a.avgWeaponCapPct}%`}
            sub={`Final: ${stats.a.weaponCapPct}% · sin cap: ${stats.a.capStarvedPct}%`}
          />
          <ShipMetricRow
            label="Casco restante"
            value={`${stats.a.hullPct}%`}
            sub={`Hasta destrucción · HP+escudo: ${stats.a.totalHpPct}%`}
          />
        </ShipMetricColumn>

        <ShipMetricColumn side="b" ship={shipB} tag={tagB}>
          <ShipMetricRow
            label="Detección"
            value={`${((detection?.b?.rangeM ?? 0) / 1000).toFixed(1)} km`}
            sub="Rango efectivo"
          />
          <ShipMetricRow
            label="DPS efectivo"
            value={stats.b.effectiveDps}
            sub={`Teórico sim: ${stats.b.theoreticalDps} · raw armas: ${stats.b.rawWeaponDps}`}
          />
          <ShipMetricRow
            label="Banco de armas"
            value={stats.b.weaponCapCapacity}
            sub={`${sourceLabel(stats.b.weaponDataSource)} · ${stats.b.weaponCount} armas · recarga ${stats.b.weaponCapRegen}/s · consumo ${stats.b.weaponCapDrain}/s`}
          />
          <ShipMetricRow
            label="Munición"
            value={ammoB.value}
            sub={ammoB.sub}
          />
          <ShipMetricRow
            label="Disparos"
            value={stats.b.shotsFired}
            sub={`${stats.b.hits} impactos`}
          />
          <ShipMetricRow
            label="Impactos"
            value={stats.b.hits}
            sub={`${stats.b.hitPct}% acierto`}
          />
          <ShipMetricRow
            label="Daño infligido"
            value={stats.b.totalDmgDealt}
            sub={`${formatDamageTypes(stats.b.damageByType)} · escudo ${stats.b.shieldDmgDealt} · casco ${stats.b.hullDmgDealt}`}
          />
          <ShipMetricRow
            label="Ventana de fuego"
            value={`${stats.b.fireUptimePct}%`}
            sub={`${stats.b.fireTimeSec}s disparando`}
          />
          <ShipMetricRow
            label="Capacitor medio"
            value={`${stats.b.avgWeaponCapPct}%`}
            sub={`Final: ${stats.b.weaponCapPct}% · sin cap: ${stats.b.capStarvedPct}%`}
          />
          <ShipMetricRow
            label="Casco restante"
            value={`${stats.b.hullPct}%`}
            sub={`Hasta destrucción · HP+escudo: ${stats.b.totalHpPct}%`}
          />
        </ShipMetricColumn>
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
