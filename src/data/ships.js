/**
 * ships.js — Datos de naves (mock)
 *
 * Fuente actual : conocimiento del juego patch 3.23/4.0
 * Fuente futura : spviewer.eu / scunpacked-data
 *
 * Modelo de accuracy y evasion:
 *
 * ACCURACY base 0.60 + contribuciones:
 *   Maniobrabilidad  ±0.10  (muy alta +0.10, alta +0.06, media +0.02, baja -0.04)
 *   Velocidad SCM    ±0.06  (baja +0.06, media +0.03, alta +0.00, muy alta -0.02)
 *   Hardpoints       ±0.06  (S1-S2 +0.06, S2-S3 mix +0.03, S3+ -0.00)
 *   Nº armas         ±0.04  (4+ armas +0.04, 3 armas +0.02, 2 armas +0.00)
 *
 * EVASION base 0.22 + contribuciones:
 *   Maniobrabilidad  ±0.10  (muy alta +0.10, alta +0.06, media +0.02, baja -0.04)
 *   Velocidad SCM    ±0.06  (muy alta +0.06, alta +0.04, media +0.02, baja +0.00)
 *   Tamaño nave      ±0.06  (XS +0.06, S +0.04, M +0.00, L -0.04)
 */

import { WEAPON_CATALOG, WEAPON_DPS_TO_SIM_SCALE, calibratedWeaponDps, weaponMount } from './weapons.js'

export const SHIPS = {

  // ─── AEGIS DYNAMICS ───────────────────────────────────────────

  aegs_gladius: {
    id:             'aegs_gladius',
    name:           'Gladius',
    manufacturer:   'Aegis Dynamics',
    role:           'Fighter',
    size:           'S',
    weapons:        ['CF-227 Badger ×2 (S2)', 'CF-337 Panther ×1 (S3)'],
    weaponLoadout:  [weaponMount('cf_227_panther', 2), weaponMount('cf_337_panther', 1)],
    hardpoints:     { S2: 2, S3: 1 },
    hullMax:        1050,
    shieldMax:      1100,
    shieldRegen:    78,
    shieldCooldown: 5,
    dps:            170,
    accuracy:       0.72,
    evasion:        0.32,
    speedSCM:       210,
    speedBoost:     1200,
  },

  aegs_avenger_titan: {
    id:             'aegs_avenger_titan',
    name:           'Avenger Titan',
    manufacturer:   'Aegis Dynamics',
    role:           'Fighter',
    size:           'S',
    weapons:        ['CF-117 Bulldog ×2 (S1)', 'CF-227 Badger ×1 (S2)'],
    weaponLoadout:  [weaponMount('cf_117_badger', 2), weaponMount('cf_227_panther', 1)],
    hardpoints:     { S1: 2, S2: 1 },
    hullMax:        900,
    shieldMax:      850,
    shieldRegen:    62,
    shieldCooldown: 5,
    dps:            120,
    // Maniobrabilidad media +0.02 | SCM 185 baja +0.06 | S1-S2 +0.06 | 3 armas +0.02
    accuracy:       0.74,
    // Maniobrabilidad media +0.02 | SCM 185 baja +0.00 | tamaño S +0.04
    evasion:        0.28,
    speedSCM:       185,
    speedBoost:     1050,
  },

  aegs_avenger_stalker: {
    id:             'aegs_avenger_stalker',
    name:           'Avenger Stalker',
    manufacturer:   'Aegis Dynamics',
    role:           'Bounty Hunter',
    size:           'S',
    weapons:        ['CF-117 Bulldog ×2 (S1)', 'CF-227 Badger ×1 (S2)', 'Misiles S2 ×4'],
    weaponLoadout:  [weaponMount('cf_117_badger', 2), weaponMount('cf_227_panther', 1), weaponMount('missile_s2', 4)],
    hardpoints:     { S1: 2, S2: 1 },
    hullMax:        900,
    shieldMax:      850,
    shieldRegen:    62,
    shieldCooldown: 5,
    dps:            115,
    accuracy:       0.74,
    evasion:        0.28,
    speedSCM:       185,
    speedBoost:     1050,
  },

  // ─── ANVIL AEROSPACE ──────────────────────────────────────────

  anvl_arrow: {
    id:             'anvl_arrow',
    name:           'Arrow',
    manufacturer:   'Anvil Aerospace',
    role:           'Interceptor',
    size:           'XS',
    weapons:        ['CF-227 Badger ×2 (S2)'],
    weaponLoadout:  [weaponMount('cf_227_panther', 2)],
    hardpoints:     { S2: 2 },
    hullMax:        750,
    shieldMax:      850,
    shieldRegen:    65,
    shieldCooldown: 5,
    dps:            115,
    // Maniobrabilidad muy alta +0.10 | SCM 235 alta +0.00 | S2 +0.06 | 2 armas +0.00 → penaliza velocidad alta -0.10
    accuracy:       0.66,
    // Maniobrabilidad muy alta +0.10 | SCM 235 alta +0.04 | tamaño XS +0.06
    evasion:        0.42,
    speedSCM:       235,
    speedBoost:     1400,
  },

  anvl_hornet_f7c: {
    id:             'anvl_hornet_f7c',
    name:           'F7C Hornet',
    manufacturer:   'Anvil Aerospace',
    role:           'Fighter',
    size:           'S',
    weapons:        ['CF-227 Badger ×2 (S2)', 'CF-337 Panther ×1 (S3)', 'CF-227 Badger ×1 torreta'],
    weaponLoadout:  [weaponMount('cf_227_panther', 2), weaponMount('cf_337_panther', 1), weaponMount('cf_227_panther', 1, 'turret')],
    hardpoints:     { S2: 3, S3: 1 },
    hullMax:        1100,
    shieldMax:      1050,
    shieldRegen:    74,
    shieldCooldown: 5,
    dps:            190,
    // Maniobrabilidad media +0.02 | SCM 195 media +0.03 | S2-S3 mix +0.03 | 4 armas +0.04
    accuracy:       0.72,
    // Maniobrabilidad media +0.02 | SCM 195 media +0.02 | tamaño S +0.04
    evasion:        0.30,
    speedSCM:       195,
    speedBoost:     1150,
  },

  anvl_hornet_f7cm: {
    id:             'anvl_hornet_f7cm',
    name:           'F7C-M Super Hornet',
    manufacturer:   'Anvil Aerospace',
    role:           'Heavy Fighter',
    size:           'S',
    weapons:        ['CF-227 Badger ×2 (S2)', 'CF-337 Panther ×2 (S3)', 'Turret CF-227 Badger ×1 (S2)'],
    weaponLoadout:  [weaponMount('cf_227_panther', 2), weaponMount('cf_337_panther', 2), weaponMount('cf_227_panther', 1, 'turret')],
    hardpoints:     { S2: 3, S3: 2 },
    hullMax:        1300,
    shieldMax:      1250,
    shieldRegen:    85,
    shieldCooldown: 5,
    dps:            240,
    // Maniobrabilidad baja -0.04 | SCM 180 baja +0.06 | S2-S3 mix +0.03 | 5 armas +0.04
    accuracy:       0.70,
    // Maniobrabilidad baja -0.04 | SCM 180 baja +0.00 | tamaño S +0.04
    evasion:        0.22,
    speedSCM:       180,
    speedBoost:     1050,
  },

  anvl_hornet_f7cs: {
    id:             'anvl_hornet_f7cs',
    name:           'F7C-S Hornet Ghost',
    manufacturer:   'Anvil Aerospace',
    role:           'Stealth Fighter',
    size:           'S',
    weapons:        ['CF-227 Badger ×2 (S2)', 'CF-337 Panther ×1 (S3)'],
    weaponLoadout:  [weaponMount('cf_227_panther', 2), weaponMount('cf_337_panther', 1)],
    hardpoints:     { S2: 2, S3: 1 },
    hullMax:        950,
    shieldMax:      900,
    shieldRegen:    68,
    shieldCooldown: 5,
    dps:            160,
    // Maniobrabilidad alta +0.06 | SCM 200 media +0.03 | S2-S3 mix +0.03 | 3 armas +0.02
    accuracy:       0.74,
    // Maniobrabilidad alta +0.06 | SCM 200 media +0.02 | tamaño S +0.04 | bonus stealth +0.04
    evasion:        0.38,
    speedSCM:       200,
    speedBoost:     1150,
  },

  anvl_hornet_f7cr: {
    id:             'anvl_hornet_f7cr',
    name:           'F7C-R Hornet Tracker',
    manufacturer:   'Anvil Aerospace',
    role:           'Recon Fighter',
    size:           'S',
    weapons:        ['CF-227 Badger ×2 (S2)', 'Misiles S2 ×4'],
    weaponLoadout:  [weaponMount('cf_227_panther', 2), weaponMount('missile_s2', 4)],
    hardpoints:     { S2: 2 },
    hullMax:        1000,
    shieldMax:      950,
    shieldRegen:    70,
    shieldCooldown: 5,
    dps:            130,
    // Maniobrabilidad media +0.02 | SCM 195 media +0.03 | S2 +0.06 | 2 armas +0.00
    accuracy:       0.71,
    // Maniobrabilidad media +0.02 | SCM 195 media +0.02 | tamaño S +0.04
    evasion:        0.30,
    speedSCM:       195,
    speedBoost:     1150,
  },

  // ─── DRAKE INTERPLANETARY ─────────────────────────────────────

  drak_buccaneer: {
    id:             'drak_buccaneer',
    name:           'Buccaneer',
    manufacturer:   'Drake Interplanetary',
    role:           'Light Fighter',
    size:           'S',
    weapons:        ['Neutron Repeater ×2 (S2)', 'M5A Cannon ×1 (S3)', 'M4A Cannon ×2 (S2)'],
    weaponLoadout:  [weaponMount('neutron_repeater_s2', 2), weaponMount('laser_cannon_s3', 1), weaponMount('laser_cannon_s2', 2)],
    hardpoints:     { S2: 4, S3: 1 },
    hullMax:        800,
    shieldMax:      780,
    shieldRegen:    58,
    shieldCooldown: 5,
    dps:            210,
    // Maniobrabilidad alta +0.06 | SCM 215 media +0.03 | S2-S3 mix +0.03 | 5 armas +0.04
    accuracy:       0.76,
    // Maniobrabilidad alta +0.06 | SCM 215 media +0.02 | tamaño S +0.04
    evasion:        0.34,
    speedSCM:       215,
    speedBoost:     1250,
  },

  // ─── CONSOLIDATED OUTLAND ─────────────────────────────────────

  cnou_mustang_alpha: {
    id:             'cnou_mustang_alpha',
    name:           'Mustang Alpha',
    manufacturer:   'Consolidated Outland',
    role:           'Starter Fighter',
    size:           'S',
    weapons:        ['M3A Cannon ×2 (S1)'],
    weaponLoadout:  [weaponMount('laser_cannon_s1', 2)],
    hardpoints:     { S1: 2 },
    hullMax:        650,
    shieldMax:      600,
    shieldRegen:    48,
    shieldCooldown: 5,
    dps:            80,
    // Maniobrabilidad muy alta +0.10 | SCM 220 alta +0.00 | S1 +0.06 | 2 armas +0.00 → penaliza velocidad -0.10
    accuracy:       0.66,
    // Maniobrabilidad muy alta +0.10 | SCM 220 alta +0.04 | tamaño S +0.04
    evasion:        0.40,
    speedSCM:       220,
    speedBoost:     1350,
  },

  cnou_mustang_delta: {
    id:             'cnou_mustang_delta',
    name:           'Mustang Delta',
    manufacturer:   'Consolidated Outland',
    role:           'Interceptor',
    size:           'S',
    weapons:        ['M3A Cannon ×2 (S1)', 'Misiles S2 ×4'],
    weaponLoadout:  [weaponMount('laser_cannon_s1', 2), weaponMount('missile_s2', 4)],
    hardpoints:     { S1: 2 },
    hullMax:        650,
    shieldMax:      620,
    shieldRegen:    50,
    shieldCooldown: 5,
    dps:            85,
    accuracy:       0.66,
    // Interceptor, mayor evasión que Alpha
    evasion:        0.42,
    speedSCM:       230,
    speedBoost:     1400,
  },

  // ─── ROBERTS SPACE INDUSTRIES ─────────────────────────────────

  rsi_aurora_mr: {
    id:             'rsi_aurora_mr',
    name:           'Aurora MR',
    manufacturer:   'Roberts Space Industries',
    role:           'Starter Fighter',
    size:           'S',
    weapons:        ['M3A Cannon ×2 (S1)'],
    weaponLoadout:  [weaponMount('laser_cannon_s1', 2)],
    hardpoints:     { S1: 2 },
    hullMax:        600,
    shieldMax:      550,
    shieldRegen:    42,
    shieldCooldown: 5,
    dps:            75,
    // Maniobrabilidad media +0.02 | SCM 175 baja +0.06 | S1 +0.06 | 2 armas +0.00
    accuracy:       0.74,
    // Maniobrabilidad media +0.02 | SCM 175 baja +0.00 | tamaño S +0.04
    evasion:        0.28,
    speedSCM:       175,
    speedBoost:     975,
  },

  rsi_aurora_ln: {
    id:             'rsi_aurora_ln',
    name:           'Aurora LN',
    manufacturer:   'Roberts Space Industries',
    role:           'Light Fighter',
    size:           'S',
    weapons:        ['M4A Cannon ×2 (S2)'],
    weaponLoadout:  [weaponMount('laser_cannon_s2', 2)],
    hardpoints:     { S2: 2 },
    hullMax:        700,
    shieldMax:      680,
    shieldRegen:    52,
    shieldCooldown: 5,
    dps:            105,
    // Maniobrabilidad media +0.02 | SCM 175 baja +0.06 | S2 +0.06 | 2 armas +0.00
    accuracy:       0.74,
    // Maniobrabilidad media +0.02 | SCM 175 baja +0.00 | tamaño S +0.04
    evasion:        0.28,
    speedSCM:       175,
    speedBoost:     975,
  },

  // ─── MIRAI ────────────────────────────────────────────────────

  mrai_guardian: {
    id:             'mrai_guardian',
    name:           'Guardian',
    manufacturer:   'Mirai',
    role:           'Fighter',
    size:           'S',
    weapons:        ['CF-227 Badger ×4 (S2)'],
    weaponLoadout:  [weaponMount('laser_repeater_s2', 4)],
    hardpoints:     { S2: 4 },
    hullMax:        980,
    shieldMax:      1000,
    shieldRegen:    72,
    shieldCooldown: 5,
    dps:            185,
    // Maniobrabilidad alta +0.06 | SCM 205 media +0.03 | S2 +0.06 | 4 armas +0.04
    accuracy:       0.78,
    // Maniobrabilidad alta +0.06 | SCM 205 media +0.02 | tamaño S +0.04
    evasion:        0.34,
    speedSCM:       205,
    speedBoost:     1200,
  },

  mrai_guardian_qi: {
    id:             'mrai_guardian_qi',
    name:           'Guardian QI',
    manufacturer:   'Mirai',
    role:           'Stealth Fighter',
    size:           'S',
    weapons:        ['CF-227 Badger ×4 (S2)'],
    weaponLoadout:  [weaponMount('laser_repeater_s2', 4)],
    hardpoints:     { S2: 4 },
    hullMax:        900,
    shieldMax:      920,
    shieldRegen:    68,
    shieldCooldown: 5,
    dps:            175,
    accuracy:       0.78,
    // Bonus stealth +0.04 sobre Guardian base
    evasion:        0.38,
    speedSCM:       210,
    speedBoost:     1250,
  },

}

// ── Banco de armas (mock) ───────────────────────────────────────────
// La capacidad del capacitor/cargador depende de las armas equipadas, no del
// escudo de la nave. Los valores se inspiran en columnas como Ammo, Burst DPS,
// Alpha, RPM, Range, Spread, Power y EM Max.
function withWeaponDefaults(ship) {
  const weaponLoadout = normalizeWeaponLoadout(ship)
  const weaponBank = calculateWeaponBank(ship, weaponLoadout)
  const legacyDps = Number(ship.dps) || 0
  const dps = calibratedWeaponDps(weaponBank, legacyDps)

  return {
    ...ship,
    dps,
    legacyDps,
    dpsSource: weaponBank.dataSource,
    weaponLoadout,
    weaponBank,
    weaponCapBase: weaponBank.capacity,
    weaponRegenBase: weaponBank.regenPerSec,
    weaponDrainBase: weaponBank.drainPerSec,
    weaponRangeM: weaponBank.rangeM,
    damageProfile: weaponBank.damageProfile,
  }
}

function normalizeWeaponLoadout(ship) {
  const loadout = Array.isArray(ship.weaponLoadout) && ship.weaponLoadout.length > 0
    ? ship.weaponLoadout
    : inferWeaponLoadout(ship)

  return loadout
    .map((mount) => {
      const weapon = WEAPON_CATALOG[mount.weaponId]
      if (!weapon) return null
      const count = Math.max(1, Number(mount.count) || 1)
      return {
        ...weapon,
        count,
        mount: mount.mount ?? 'fixed',
        totalBurstDps: (Number(weapon.burstDps) || 0) * count,
        simBurstDps: (Number(weapon.burstDps) || 0) * count * WEAPON_DPS_TO_SIM_SCALE,
        simAlpha: (Number(weapon.alpha) || 0) * WEAPON_DPS_TO_SIM_SCALE,
        damageProfile: normalizeDamageProfile(weapon),
      }
    })
    .filter(Boolean)
}

function inferWeaponLoadout(ship) {
  const hardpoints = Object.entries(ship.hardpoints ?? {})
  if (hardpoints.length === 0) return []

  return hardpoints.map(([sizeKey, count]) => {
    const size = Number(String(sizeKey).replace('S', '')) || 1
    return {
      weaponId: `generic_laser_s${size}`,
      count,
      fallbackWeapon: genericWeaponForSize(size, ship.dps, count),
    }
  }).map((mount) => {
    if (!WEAPON_CATALOG[mount.weaponId]) {
      WEAPON_CATALOG[mount.weaponId] = mount.fallbackWeapon
    }
    return mount
  })
}

function genericWeaponForSize(size, shipDps, count) {
  const burstDps = Math.max(25, (Number(shipDps) || 100) / Math.max(1, Number(count) || 1))
  return {
    id: `generic_laser_s${size}`,
    name: `Laser S${size}`,
    type: 'Laser Repeater',
    size,
    ammo: Infinity,
    burstDps,
    alpha: 45 + size * 45,
    rpm: 360,
    speed: 1000,
    range: 2400 + size * 180,
    spreadMax: 0.45,
    power: 0.45 + size * 0.18,
    emMax: 110 + size * 85,
    health: 900 + size * 150,
  }
}

function calculateWeaponBank(ship, loadout) {
  const activeWeapons = loadout.filter(w => w.affectsWeaponBank !== false && (Number(w.burstDps) || 0) > 0)
  const totalCount = activeWeapons.reduce((sum, w) => sum + w.count, 0)
  const totalBurstDps = activeWeapons.reduce((sum, w) => sum + (Number(w.burstDps) || 0) * w.count, 0)
  const avgSize = weightedAverage(activeWeapons, w => Number(w.size) || 1, w => w.count)
  const rangeM = weightedAverage(activeWeapons, w => Number(w.range) || 0, w => (Number(w.burstDps) || 0) * w.count)
  const emMax = activeWeapons.reduce((sum, w) => sum + (Number(w.emMax) || 0) * w.count, 0)
  const powerDraw = activeWeapons.reduce((sum, w) => sum + (Number(w.power) || 0) * w.count, 0)
  const realCount = activeWeapons.reduce((sum, w) => sum + (w.source === 'real' ? w.count : 0), 0)
  const dataSource = realCount <= 0 ? 'mock' : realCount >= totalCount ? 'real' : 'mixed'
  const realRegen = activeWeapons.reduce((sum, w) => sum + (Number(w.capacitorRegen) || 0) * w.count, 0)
  const weaponGroups = activeWeapons.map(toWeaponFireGroup)
  const damageProfile = aggregateDamageProfile(weaponGroups)
  const ammoCapacity = weaponGroups.reduce((sum, group) => sum + (Number(group.ammoCapacity) || 0), 0)
  const ballisticWeaponCount = weaponGroups
    .filter(group => Number.isFinite(Number(group.ammoCapacity)) && Number(group.ammoCapacity) > 0)
    .reduce((sum, group) => sum + (Number(group.count) || 0), 0)

  const capacity = clamp(
    75,
    activeWeapons.reduce((sum, w) => sum + weaponCapacityUnits(w) * w.count, 0),
    190
  )
  const drainPerSec = clamp(
    18,
    activeWeapons.reduce((sum, w) => sum + weaponDrainPerSecond(w) * w.count, 0),
    62
  )
  const regenPerSec = clamp(
    10,
    realRegen > 0
      ? realRegen
      : 10 + totalCount * 0.65 + avgSize * 1.4 + Math.max(0, 260 - totalBurstDps) / 45 - powerDraw * 0.25,
    36
  )

  return {
    capacity: Math.round(capacity),
    regenPerSec: round1(regenPerSec),
    drainPerSec: round1(drainPerSec),
    rangeM: Math.round(rangeM || 0),
    totalBurstDps: Math.round(totalBurstDps),
    weaponCount: totalCount,
    avgSize: round1(avgSize || 0),
    emMax: Math.round(emMax),
    powerDraw: round1(powerDraw),
    dataSource,
    realWeaponCount: realCount,
    ammoCapacity,
    ballisticWeaponCount,
    damageProfile,
    weaponGroups,
  }
}

function toWeaponFireGroup(weapon) {
  const rpm = Math.max(1, Number(weapon.rpm) || 60)
  const alpha = Math.max(0, Number(weapon.alpha) || 0)
  const burstDps = Math.max(0, Number(weapon.burstDps) || 0)
  const simAlpha = Math.max(0, Number(weapon.simAlpha) || alpha * WEAPON_DPS_TO_SIM_SCALE)
  const capCost = weaponCapCostPerShot(weapon)
  const count = Math.max(1, Number(weapon.count) || 1)
  const ammoPerWeapon = Number(weapon.ammo)
  const ammoCapacity = Number.isFinite(ammoPerWeapon) && ammoPerWeapon > 0
    ? Math.round(ammoPerWeapon * count)
    : null

  return {
    id: weapon.id,
    name: weapon.name,
    type: weapon.type,
    size: Number(weapon.size) || 1,
    count,
    mount: weapon.mount ?? 'fixed',
    rpm,
    fireIntervalSec: round3(60 / rpm),
    rawAlpha: round1(alpha),
    simAlpha: round2(simAlpha),
    rawBurstDps: round1(burstDps * count),
    simBurstDps: round1(burstDps * count * WEAPON_DPS_TO_SIM_SCALE),
    rangeM: Math.round(Number(weapon.range) || 0),
    projectileSpeed: Math.round(Number(weapon.speed) || 0),
    spreadMax: Number(weapon.spreadMax) || 0,
    capCostPerShot: round2(capCost),
    ammoCapacity,
    ammoPerWeapon: ammoCapacity === null ? null : Math.round(ammoPerWeapon),
    penetration: normalizePenetration(weapon),
    damageProfile: weapon.damageProfile ?? normalizeDamageProfile(weapon),
    source: weapon.source ?? 'mock',
  }
}

function weaponCapCostPerShot(weapon) {
  if (isBallisticWeapon(weapon)) return 0

  const capCost = Number(weapon.capacitorCostPerShot)
  if (Number.isFinite(capCost) && capCost > 0) return capCost / 18

  const drain = weaponDrainPerSecond(weapon)
  const rpm = Number(weapon.rpm) || 60
  return drain / Math.max(1, rpm / 60)
}

function normalizePenetration(weapon) {
  const p = weapon.penetration && typeof weapon.penetration === 'object' ? weapon.penetration : {}
  const explicitThickness = Number(p.thickness)
  const explicitBase = Number(p.baseDistance)
  const thickness = Number.isFinite(explicitThickness) && explicitThickness > 0
    ? explicitThickness
    : inferredPenetrationThickness(weapon)

  return {
    thickness: round2(thickness),
    baseDistance: Number.isFinite(explicitBase) && explicitBase > 0
      ? round2(explicitBase)
      : round2(thickness * 0.35),
  }
}

function inferredPenetrationThickness(weapon) {
  const size = Number(weapon.size) || 1
  const alpha = Number(weapon.alpha) || 0
  const type = `${weapon.type ?? ''} ${weapon.name ?? ''}`.toLowerCase()

  if (type.includes('ballistic cannon')) return clamp(0.6, 0.45 + size * 0.35 + alpha / 650, 4.5)
  if (type.includes('ballistic')) return clamp(0.35, 0.25 + size * 0.22 + alpha / 900, 3.2)
  return clamp(0.05, 0.06 + size * 0.03, 0.35)
}

function isBallisticWeapon(weapon) {
  return /ballistic/i.test(`${weapon.type ?? ''} ${weapon.name ?? ''}`)
}

function normalizeDamageProfile(weapon) {
  const explicit = weapon.damageTypes && typeof weapon.damageTypes === 'object'
    ? Object.entries(weapon.damageTypes)
      .map(([type, value]) => [normalizeDamageType(type), Math.max(0, Number(value) || 0)])
      .filter(([, value]) => value > 0)
    : []

  const total = explicit.reduce((sum, [, value]) => sum + value, 0)
  if (total > 0) {
    return Object.fromEntries(explicit.map(([type, value]) => [type, value / total]))
  }

  const type = `${weapon.type ?? ''} ${weapon.name ?? ''}`.toLowerCase()
  if (type.includes('distortion')) return { distortion: 1 }
  if (type.includes('ballistic')) return { physical: 1 }
  return { energy: 1 }
}

function aggregateDamageProfile(groups) {
  const totals = {}
  groups.forEach((group) => {
    const weight = Math.max(0, Number(group.simBurstDps) || 0)
    Object.entries(group.damageProfile ?? {}).forEach(([type, fraction]) => {
      totals[type] = (totals[type] ?? 0) + weight * (Number(fraction) || 0)
    })
  })

  const total = Object.values(totals).reduce((sum, value) => sum + value, 0)
  if (total <= 0) return {}

  return Object.fromEntries(Object.entries(totals).map(([type, value]) => [type, round3(value / total)]))
}

function normalizeDamageType(type) {
  const t = String(type || '').toLowerCase()
  if (t === 'impact') return 'physical'
  return t
}

function weaponCapacityUnits(weapon) {
  const capacitorAmmo = Number(weapon.capacitorAmmo)
  if (Number.isFinite(capacitorAmmo) && capacitorAmmo > 0) {
    return clamp(12, capacitorAmmo, 80)
  }

  const size = Number(weapon.size) || 1
  const alpha = Number(weapon.alpha) || 0
  const rpm = Number(weapon.rpm) || 0
  const range = Number(weapon.range) || 0
  const spread = Number(weapon.spreadMax) || 0
  const power = Number(weapon.power) || 0
  const type = weapon.type || ''

  if (/ballistic/i.test(type)) {
    return clamp(12, 14 + size * 4 + finiteAmmoSeconds(weapon) / 12 + alpha / 120 - spread * 1.4, 42)
  }

  const cannonBonus = /cannon/i.test(type) ? 3 : 0
  return clamp(16, 20 + size * 6 + alpha / 55 + range / 900 - rpm / 180 - power * 3 + cannonBonus, 48)
}

function weaponDrainPerSecond(weapon) {
  const capCost = Number(weapon.capacitorCostPerShot)
  const realRpm = Number(weapon.rpm)
  if (Number.isFinite(capCost) && capCost > 0 && Number.isFinite(realRpm) && realRpm > 0) {
    return clamp(4, (capCost * (realRpm / 60)) / 18, 32)
  }

  const burstDps = Number(weapon.burstDps) || 0
  const rpm = Number(weapon.rpm) || 0
  const power = Number(weapon.power) || 0
  const spread = Number(weapon.spreadMax) || 0
  const type = weapon.type || ''

  if (/ballistic/i.test(type)) {
    return clamp(3, burstDps * 0.035 + rpm / 260 + power * 4 + spread * 0.4, 14)
  }

  const cannonMult = /cannon/i.test(type) ? 0.92 : 1
  return clamp(6, (burstDps * 0.085 + rpm / 160 + power * 6 + spread * 0.5) * cannonMult, 18)
}

function finiteAmmoSeconds(weapon) {
  const ammo = Number(weapon.ammo)
  const rpm = Number(weapon.rpm)
  if (!Number.isFinite(ammo) || !Number.isFinite(rpm) || rpm <= 0) return 0
  return ammo / (rpm / 60)
}

function weightedAverage(items, valueFn, weightFn) {
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, Number(weightFn(item)) || 0), 0)
  if (totalWeight <= 0) return 0
  return items.reduce((sum, item) => {
    const weight = Math.max(0, Number(weightFn(item)) || 0)
    return sum + (Number(valueFn(item)) || 0) * weight
  }, 0) / totalWeight
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function round3(n) {
  return Math.round(n * 1000) / 1000
}

// ── Sensores y firmas (mock) ─────────────────────────────────────────
// En Star Citizen la detección depende del radar/sensores del atacante y de las firmas del objetivo (EM/IR/CS).
// Para no “ensuciar” cada entrada con datos inventados, aplicamos defaults coherentes si faltan campos.
const SIZE_DEFAULTS = {
  XS: { sigCS: 0.55, radarStrength: 0.92 },
  S:  { sigCS: 1.00, radarStrength: 1.00 },
  M:  { sigCS: 1.70, radarStrength: 1.12 },
  L:  { sigCS: 2.60, radarStrength: 1.25 },
}

const ROLE_SENSOR_BONUS = {
  'Recon Fighter': 0.18,
  'Bounty Hunter': 0.10,
  'Interceptor': 0.06,
  'Heavy Fighter': 0.04,
  'Stealth Fighter': 0.03,
}

function clamp(min, v, max) {
  return Math.min(max, Math.max(min, v))
}

function withSensorDefaults(ship) {
  const size = ship.size || 'S'
  const d = SIZE_DEFAULTS[size] ?? SIZE_DEFAULTS.S
  const role = ship.role || ''
  const isStealth = /stealth|ghost|qi/i.test(`${role} ${ship.name}`)

  // radarStrength: capacidad de sensores de la nave (1.0 = “estándar”)
  const roleSensorBonus = ROLE_SENSOR_BONUS[role] ?? 0
  const radarStrength = ship.radarStrength
    ?? clamp(0.75, d.radarStrength + roleSensorBonus + ((ship.hardpoints?.S3 ?? 0) * 0.01), 1.55)

  // Firmas relativas (1.0 = medio). Se derivan de componentes/estado stock:
  // EM: armas, escudos y generacion electrica; IR: motores/calor; CS: tamano fisico.
  const stealthEMIR = isStealth ? 0.72 : 1
  const stealthCS = isStealth ? 0.85 : 1
  const weaponEm = (ship.weaponBank?.emMax ?? 0) / 1400
  const weaponPower = (ship.weaponBank?.powerDraw ?? 0) / 8
  const sigEM = ship.sigEM ?? clamp(
    0.35,
    (0.45 + (ship.dps ?? 0) / 360 * 0.28 + weaponEm * 0.18 + weaponPower * 0.10 + (ship.shieldRegen ?? 0) / 120 * 0.18 + (ship.shieldMax ?? 0) / 1800 * 0.12) * stealthEMIR,
    2.20
  )
  const sigIR = ship.sigIR ?? clamp(
    0.35,
    (0.45 + (ship.speedSCM ?? 0) / 280 * 0.24 + (ship.speedBoost ?? 0) / 1500 * 0.22 + (ship.dps ?? 0) / 500 * 0.10 + weaponPower * 0.08) * stealthEMIR,
    2.20
  )
  const sigCS = ship.sigCS ?? clamp(
    0.35,
    (d.sigCS + (ship.hullMax ?? 0) / 4000 * 0.20 + (ship.shieldMax ?? 0) / 4000 * 0.12 - (ship.evasion ?? 0.25) * 0.15) * stealthCS,
    3.50
  )
  const signatureProfile = clamp(0.30, 0.42 * sigEM + 0.33 * sigIR + 0.25 * sigCS, 3.00)

  return { ...ship, radarStrength, sigEM, sigIR, sigCS, signatureProfile }
}

Object.keys(SHIPS).forEach((id) => {
  SHIPS[id] = withSensorDefaults(withWeaponDefaults(SHIPS[id]))
})

/** Lista ordenada para selectores de UI */
export const SHIP_LIST = Object.values(SHIPS)
  .map(s => ({
    id:           s.id,
    name:         s.name,
    manufacturer: s.manufacturer,
    role:         s.role,
    size:         s.size,
    dps:          s.dps,
    hullMax:      s.hullMax,
    shieldMax:    s.shieldMax,
  }))
  .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name))

/** Lista de fabricantes únicos para filtros */
export const MANUFACTURERS = [...new Set(SHIP_LIST.map(s => s.manufacturer))].sort()
