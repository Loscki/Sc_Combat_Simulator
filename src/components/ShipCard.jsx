/**
 * ShipCard.jsx
 * Ficha de combate centrada en datos reales de nave y metricas calculadas.
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
  const isA = side === 'a'
  const color = isA ? '#378ADD' : '#D85A30'
  const weaponBank = ship.weaponBank ?? {}
  const weaponSource = ship.combatMetrics?.weaponry?.dpsSource ?? weaponBank.dataSource ?? 'mock'
  const shipSource = ship.combatMetrics?.displaySource ?? ship.shipDataSource ?? 'mock'
  const weaponSlots = ship.configurationSlots?.weapons ?? []
  const componentSlots = ship.configurationSlots?.components ?? []
  const metrics = ship.combatMetrics ?? {}
  const hull = metrics.hull ?? {}
  const weaponry = metrics.weaponry ?? {}
  const armor = metrics.armor ?? {}
  const flight = metrics.flight ?? {}
  const computed = metrics.computed ?? {}
  const accelerations = flight.accelerations ?? {}

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

  return (
    <div className="card">
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

      <div className="combat-sources">
        <div className={`data-source data-source-${weaponSource}`}>
          Armas: {sourceLabel(weaponSource)}
        </div>
        <div className={`data-source data-source-${shipSource}`}>
          Nave: {sourceLabel(shipSource)}{ship.shipDataVersion ? ` · ${ship.shipDataVersion}` : ''}
        </div>
      </div>

      <div className="ship-combat-grid">
        <SpecSection title="Casco">
          <SpecRow label="Dimensiones" value={hull.dimensionsLabel ?? '—'} />
          <SpecRow label="Masa" value={hull.massKg ? `${formatNumber(hull.massKg)} kg` : '—'} />
          <SpecRow label="HP total" value={hull.totalHealthHp ? `${formatNumber(hull.totalHealthHp)} HP` : '—'} />
          <SpecRow label="Body" value={hull.bodyHp ? `${formatNumber(hull.bodyHp)} HP` : '—'} />
        </SpecSection>

        <SpecSection title="Armamento">
          <SpecRow
            label="Pilot DPS"
            value={weaponry.pilotBurstDps ? `${formatNumber(weaponry.pilotSustainedDps)} sust. / ${formatNumber(weaponry.pilotBurstDps)} burst` : '—'}
          />
          <SpecRow label="Alpha" value={weaponry.pilotAlpha ? formatNumber(weaponry.pilotAlpha) : '—'} />
          <SpecRow
            label="Misiles"
            value={weaponry.missileDamage ? `${formatNumber(weaponry.missileDamage)} dmg` : '—'}
            sub={weaponry.missileCount ? `${weaponry.missileCount} misiles` : null}
          />
          <SpecRow label="Escudo" value={weaponry.shieldBubbleHp ? `${formatNumber(weaponry.shieldBubbleHp)} HP` : '—'} />
          <SpecRow
            label="Mun. bal."
            value={weaponry.ballisticAmmo ? formatNumber(weaponry.ballisticAmmo) : '—'}
            sub={weaponry.ballisticWeaponCount ? `${weaponry.ballisticWeaponCount} armas balísticas` : null}
          />
        </SpecSection>

        <SpecSection title="Blindaje">
          <SpecRow
            label="Casco efectivo"
            value={(
              <ValueTooltip
                value={joinParts([
                  numberPart('Físico', armor.effectiveHullHp?.physical, 'HP'),
                  numberPart('Energía', armor.effectiveHullHp?.energy, 'HP'),
                ])}
                tooltipTitle="Cómo se calcula"
                tooltipLines={effectiveHullTooltipLines(hull, armor)}
              />
            )}
            sub={armor.apiHealthHp ? `Armor health API: ${formatNumber(armor.apiHealthHp)} HP` : null}
          />
          <SpecRow
            label="Mod. daño"
            value={joinParts([
              pctPart('Físico', armor.damageModifiers?.physical),
              pctPart('Energía', armor.damageModifiers?.energy),
              pctPart('Dist.', armor.damageModifiers?.distortion),
            ])}
          />
          <SpecRow
            label="Durabilidad"
            value={joinParts([
              pctPart('Físico', armor.durabilityModifiers?.physical),
              pctPart('Energía', armor.durabilityModifiers?.energy),
            ])}
          />
          <SpecRow
            label="Mod. firma"
            value={joinParts([
              pctPart('EM', armor.signatureModifiers?.electromagnetic),
              pctPart('CS', armor.signatureModifiers?.crossSection),
              pctPart('IR', armor.signatureModifiers?.infrared),
            ])}
          />
          <SpecRow
            label="Deflexión"
            value={joinParts([
              numberPart('Físico', armor.deflection?.physical),
              numberPart('Energía', armor.deflection?.energy),
            ])}
          />
          <SpecRow
            label="Resist. pen."
            value={joinParts([
              pctPart('Físico', armor.penetrationResistance?.physical),
              pctPart('Energía', armor.penetrationResistance?.energy),
            ])}
          />
        </SpecSection>

        <SpecSection title="Vuelo">
          <SpecRow label="SCM / Boost" value={joinParts([flight.scm ? `${flight.scm} m/s` : null, flight.forwardBoost ? `${flight.forwardBoost} m/s` : null], ' / ')} />
          <SpecRow label="NAV" value={flight.nav ? `${flight.nav} m/s` : '—'} />
          <SpecRow label="Zero a SCM" value={ship.zeroToScm ? `${formatNumber(ship.zeroToScm)} s` : '—'} />
          <SpecRow label="Pitch / Yaw / Roll" value={joinParts([flight.pitch, flight.yaw, flight.roll].map(formatAngle), ' / ')} />
          <SpecRow label="Boosted" value={joinParts([flight.pitchBoosted, flight.yawBoosted, flight.rollBoosted].map(formatAngle), ' / ')} />
        </SpecSection>

        <SpecSection title="Aceleraciones" subtitle={accelerations.estimated ? 'Estimadas en G' : null}>
          <SpecRow label="Main" value={formatAcceleration(accelerations.main)} />
          <SpecRow label="Retro" value={formatAcceleration(accelerations.retro)} />
          <SpecRow label="Up" value={formatAcceleration(accelerations.up)} />
          <SpecRow label="Down" value={formatAcceleration(accelerations.down)} />
          <SpecRow label="Strafe" value={formatAcceleration(accelerations.strafe)} />
        </SpecSection>

        <SpecSection title="Cálculo">
          <SpecRow label="Precisión" value={computed.precisionPct !== undefined ? `${computed.precisionPct}%` : '—'} />
          <SpecRow label="Evasión" value={computed.evasionPct !== undefined ? `${computed.evasionPct}%` : '—'} />
          <SpecRow label="Maniobr." value={computed.maneuverabilityPct !== undefined ? `${computed.maneuverabilityPct}%` : '—'} />
        </SpecSection>
      </div>
    </div>
  )
}

function SpecSection({ title, subtitle, children }) {
  return (
    <section className="ship-spec-section">
      <div className="ship-spec-title-row">
        <h3 className="ship-spec-title">{title}</h3>
        {subtitle ? <span className="ship-spec-subtitle">{subtitle}</span> : null}
      </div>
      <div className="ship-spec-list">{children}</div>
    </section>
  )
}

function SpecRow({ label, value, sub = null }) {
  return (
    <div className="ship-spec-row">
      <span className="ship-spec-label">{label}</span>
      <div className="ship-spec-value-wrap">
        {typeof value === 'string' ? <span className="ship-spec-value">{value || '—'}</span> : (value || <span className="ship-spec-value">—</span>)}
        {sub ? <span className="ship-spec-row-sub">{sub}</span> : null}
      </div>
    </div>
  )
}

function ValueTooltip({ value, tooltipTitle, tooltipLines }) {
  const lines = Array.isArray(tooltipLines) ? tooltipLines.filter(Boolean) : []

  return (
    <span className="ship-value-tooltip" tabIndex={0}>
      <span className="ship-spec-value ship-spec-value-tooltip-trigger">{value || '—'}</span>
      {lines.length > 0 ? (
        <span className="ship-value-tooltip-popup" role="tooltip">
          {tooltipTitle ? <span className="ship-value-tooltip-title">{tooltipTitle}</span> : null}
          {lines.map((line) => (
            <span key={line} className="ship-value-tooltip-line">{line}</span>
          ))}
        </span>
      ) : null}
    </span>
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
  if (source === 'mixed') return 'real + estimado'
  if (source === 'estimated') return 'estimado'
  return 'fallback mock'
}

function joinParts(parts, separator = ' · ') {
  const values = parts.filter(Boolean)
  return values.length > 0 ? values.join(separator) : '—'
}

function pctPart(label, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null
  const n = Number(value)
  const sign = n > 0 ? '+' : ''
  return `${label} ${sign}${Math.round(n)}%`
}

function numberPart(label, value, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null
  return `${label} ${formatNumber(value)}${suffix ? ` ${suffix}` : ''}`
}

function effectiveHullTooltipLines(hull, armor) {
  const hullHp = Number(hull?.totalHealthHp) || 0
  const physicalMultiplier = Number(armor?.rawDamageMultipliers?.physical)
  const energyMultiplier = Number(armor?.rawDamageMultipliers?.energy)
  const physicalEffective = armor?.effectiveHullHp?.physical
  const energyEffective = armor?.effectiveHullHp?.energy

  return [
    hullHp > 0 ? `Casco base: ${formatNumber(hullHp)} HP` : null,
    'Fórmula: casco base / multiplicador de daño',
    Number.isFinite(physicalMultiplier) && physicalEffective
      ? `Físico: ${formatNumber(hullHp)} / ${formatNumber(physicalMultiplier)} = ${formatNumber(physicalEffective)} HP`
      : null,
    Number.isFinite(energyMultiplier) && energyEffective
      ? `Energía: ${formatNumber(hullHp)} / ${formatNumber(energyMultiplier)} = ${formatNumber(energyEffective)} HP`
      : null,
    'Solo cuenta cuando el daño ya atraviesa el escudo y entra al casco.',
  ]
}

function formatNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return Number.isInteger(n) ? n.toLocaleString('es-ES') : n.toLocaleString('es-ES', { maximumFractionDigits: 1 })
}

function formatAngle(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return `${formatNumber(n)} º/s`
}

function formatAcceleration(entry) {
  if (!entry || entry.base === null || entry.base === undefined) return '—'
  return `${formatNumber(entry.base)} (${formatNumber(entry.boosted)}) G`
}
