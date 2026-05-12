/**
 * ShipCard.jsx
 * Muestra las estadísticas de una nave con barras visuales.
 * Recibe el objeto ship de ships.js y el lado ('a' | 'b').
 */

export function ShipCard({
  ship,
  shipId,
  ships,
  side,
  onSelectShip,
  onSelectWeapon,
  onSelectComponent,
}) {
  const isA    = side === 'a'
  const color  = isA ? '#378ADD' : '#D85A30'
  const shield = isA ? '#1D9E75' : '#EF9F27'
  const weaponBank = ship.weaponBank ?? {}
  const weaponCap = Number(weaponBank.capacity) || 0
  const weaponDrain = Number(weaponBank.drainPerSec) || 0
  const weaponRegen = Number(weaponBank.regenPerSec) || 0
  const powerPlantRatio = Number(weaponBank.powerPlantEnergyRatio) || 1
  const weaponSource = weaponBank.dataSource ?? 'mock'
  const shipSource = ship.shipDataSource ?? 'mock'
  const rawWeaponDps = Number(weaponBank.totalBurstDps) || 0
  const ammoCapacity = Number(weaponBank.ammoCapacity) || 0
  const ballisticWeaponCount = Number(weaponBank.ballisticWeaponCount) || 0
  const weaponSlots = ship.configurationSlots?.weapons ?? []
  const componentSlots = ship.configurationSlots?.components ?? []
  const armorPct = Number(ship.armorReductionPct) || 0
  const hullScale = Math.max(15000, ship.hullMax)
  const shieldScale = Math.max(10000, ship.shieldMax)

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
    { label: 'Casco',     value: ship.hullMax,    max: hullScale,   pct: ship.hullMax / hullScale,       col: color  },
    { label: 'Blindaje',  value: `${armorPct}%`,   max: 30,          pct: armorPct / 30,                  col: '#6F665A' },
    { label: 'Escudos',   value: ship.shieldMax,  max: shieldScale, pct: ship.shieldMax / shieldScale,   col: shield },
    { label: 'Regen/s',   value: ship.shieldRegen,max: 600,         pct: ship.shieldRegen / 600,         col: shield },
    { label: 'Capacitor', value: weaponCap,        max: 190,   pct: weaponCap / 190,        col: '#7D6B2D' },
    { label: 'Soporte',   value: `${powerPlantRatio.toFixed(2)}x`, max: 1.25, pct: Math.min(powerPlantRatio / 1.25, 1), col: '#6B7FD7' },
    { label: 'Consumo/s', value: weaponDrain.toFixed(1), max: 62, pct: weaponDrain / 62,    col: '#BA7517' },
    { label: 'Recarga/s', value: weaponRegen.toFixed(1), max: 36, pct: weaponRegen / 36,    col: '#1D9E75' },
    { label: 'Mun. bal.', value: ballisticWeaponCount > 0 ? ammoCapacity : '—', max: 6000, pct: ammoCapacity > 0 ? ammoCapacity / 6000 : 0, col: '#8B6F3D' },
    { label: 'Precisión', value: `${Math.round(ship.accuracy * 100)}%`, pct: ship.accuracy, col: '#BA7517' },
    { label: 'Evasión',   value: `${Math.round(ship.evasion * 100)}%`,  pct: ship.evasion,  col: '#888780' },
    { label: 'Radar',     value: `${ship.radarStrength.toFixed(2)}x`, pct: ship.radarStrength / 1.6, col: '#6B7FD7' },
    { label: 'Firma',     value: `${ship.signatureProfile.toFixed(2)}x`, pct: ship.signatureProfile / 2.5, col: '#B55E7A' },
  ]

  return (
    <div className="card">
      {/* Cabecera */}
      <div className="ship-header">
        <i className="ti ti-rocket" style={{ color }} aria-hidden="true" />
        <div className="ship-header-text">
          <span className="ship-name">{ship.name}</span>
          <span className="ship-meta">{ship.role} · {weaponBank.weaponCount ?? 0} armas</span>
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

      {(weaponSlots.length > 0 || componentSlots.length > 0) && (
        <div className="loadout-configurator" aria-label={`Configurador de nave ${isA ? 'Alfa' : 'Beta'}`}>
          {weaponSlots.length > 0 && (
            <div className="config-group">
              <div className="config-group-title">
                <i className="ti ti-target" aria-hidden="true" />
                <span>Armas compatibles</span>
              </div>
              {weaponSlots.map((slot) => (
                <LoadoutSelect
                  key={`weapon-${slot.id}`}
                  id={`weapon-${side}-${slot.id}`}
                  label={slot.label}
                  value={slot.selectedId}
                  baseLabel={slot.baseWeaponLabel}
                  options={slot.options}
                  onChange={(value) => onSelectWeapon(slot.id, value)}
                />
              ))}
            </div>
          )}

          {componentSlots.length > 0 && (
            <div className="config-group">
              <div className="config-group-title">
                <i className="ti ti-adjustments" aria-hidden="true" />
                <span>Componentes compatibles</span>
              </div>
              {componentSlots.map((slot) => (
                <LoadoutSelect
                  key={`component-${slot.type}`}
                  id={`component-${side}-${slot.type}`}
                  label={`${slot.label} · ${slot.mounts}x S${slot.size}`}
                  value={slot.selectedId}
                  baseLabel={slot.baseComponentLabel}
                  options={slot.options}
                  onChange={(value) => onSelectComponent(slot.type, value)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* DPS destacado */}
      <div className="dps-badge" style={{ color }}>
        DPS sim {ship.dps}
      </div>
      <div className={`data-source data-source-${weaponSource}`}>
        Armas: {sourceLabel(weaponSource)}{rawWeaponDps > 0 ? ` · raw ${rawWeaponDps}` : ''}
      </div>
      <div className={`data-source data-source-${shipSource}`}>
        Nave: {sourceLabel(shipSource)}{ship.shipDataVersion ? ` · ${ship.shipDataVersion}` : ''}
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

function LoadoutSelect({ id, label, value, baseLabel, options, onChange }) {
  return (
    <label className="config-select-row" htmlFor={id}>
      <span className="config-select-label">{label}</span>
      <select
        id={id}
        className="ship-select config-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{baseLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function sourceLabel(source) {
  if (source === 'real') return 'datos reales'
  if (source === 'mixed') return 'real + fallback'
  return 'fallback mock'
}
