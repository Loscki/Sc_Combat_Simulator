/**
 * ships.js — Datos de naves (mock)
 *
 * Fuente actual : conocimiento del juego patch 3.23/4.0
 * Fuentes reales : Star Citizen Wiki API (naves, armas y componentes)
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

import { REAL_VEHICLE_CATALOG, VEHICLE_DATA_META } from './generated/vehicles.generated.js'
import {
  COMPONENT_TYPE_LABELS,
  CONFIGURABLE_COMPONENT_TYPES,
  componentById,
  componentLabel,
  componentOptionsForSlot,
} from './components.js'
import { WEAPON_CATALOG, WEAPON_DAMAGE_TO_SIM_SCALE, WEAPON_DPS_TO_SIM_SCALE, calibratedWeaponDps, weaponMount } from './weapons.js'

const BODY_HP_OVERRIDES = {
  anvl_arrow: 1950,
  aegs_gladius: 2350,
  mrai_guardian: 7100,
  mrai_guardian_qi: 7100,
  mrai_guardian_mx: 7100,
}

const BASE_SHIPS = {

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

// ── Banco de armas / loadouts ───────────────────────────────────────
// La capacidad del capacitor/cargador depende de las armas equipadas, no del
// escudo de la nave. Los valores se inspiran en columnas como Ammo, Burst DPS,
// Alpha, RPM, Range, Spread, Power y EM Max.
export const STOCK_LOADOUT_ID = 'stock'
export const CUSTOM_LOADOUT_ID = 'custom'

const BALLISTIC_GATLING_BY_SIZE = {
  1: 'yellowjacket_gt_210_gatling',
  2: 'scorpion_gt_215_gatling',
  3: 'mantis_gt_220_gatling',
  4: 'ad4b_ballistic_gatling',
}

const BALLISTIC_CANNON_BY_SIZE = {
  1: 'deadbolt_i_cannon',
  2: 'deadbolt_ii_cannon',
  3: 'deadbolt_iii_cannon',
  4: 'deadbolt_iv_cannon',
}

const BALLISTIC_REPEATER_BY_SIZE = {
  1: 'sw16br1_buzzsaw_repeater',
  2: 'sw16br2_sawbuck_repeater',
  3: 'sw16br3_shredder_repeater',
}

const LOADOUT_PRESETS = [
  {
    id: 'ballistic_gatling',
    name: 'Balística Gatlings',
    description: 'Alta cadencia, munición finita y presión constante sobre escudos.',
    bySize: BALLISTIC_GATLING_BY_SIZE,
  },
  {
    id: 'ballistic_cannon',
    name: 'Balística Cañones',
    description: 'Menos disparos, más alpha y mejor lectura de penetración contra casco.',
    bySize: BALLISTIC_CANNON_BY_SIZE,
  },
  {
    id: 'ballistic_repeater',
    name: 'Balística Repetidores',
    description: 'Compromiso entre cadencia, alpha y reserva de munición.',
    bySize: BALLISTIC_REPEATER_BY_SIZE,
  },
]

const SHIP_API_SLUG_OVERRIDES = {
  rsi_aurora_mr: 'rsi-aurora-gs-mr',
  rsi_aurora_ln: 'rsi-aurora-gs-ln',
}

const SIGNATURE_BASELINES = {
  em: 20000,
  ir: 8000,
  cs: 8000,
}

function withRealVehicleDefaults(ship) {
  const vehicle = realVehicleForShip(ship)
  if (!vehicle) {
    return {
      ...ship,
      shipDataSource: 'mock',
      shipDataVersion: null,
    }
  }

  const hardpoints = vehicle.hardpoints ?? ship.hardpoints
  const stockLoadout = realStockLoadout(vehicle, ship.weaponLoadout)
  const stockWeapons = stockLoadout.length > 0
    ? describeLoadoutWeapons(stockLoadout)
    : ship.weapons
  const sigEM = normalizeSignature(vehicle.signature?.emShields ?? vehicle.emission?.emIdle, SIGNATURE_BASELINES.em)
  const sigIR = normalizeSignature(vehicle.signature?.irShields ?? vehicle.emission?.ir, SIGNATURE_BASELINES.ir)
  const sigCS = normalizeSignature(vehicle.crossSection?.max, SIGNATURE_BASELINES.cs)
  const maneuverProfile = realManeuverProfile(vehicle)

  return {
    ...ship,
    name: vehicle.name ?? ship.name,
    manufacturer: vehicle.manufacturer ?? ship.manufacturer,
    role: vehicle.role ?? ship.role,
    size: simSizeFromVehicle(vehicle, ship.size),
    weapons: stockWeapons,
    weaponLoadout: stockLoadout.length > 0 ? stockLoadout : ship.weaponLoadout,
    hardpoints,
    hullMax: finiteRounded(vehicle.hullHp, ship.hullMax),
    shieldMax: finiteRounded(vehicle.shieldHp, ship.shieldMax),
    shieldRegen: finiteRounded(vehicle.shieldRegen, ship.shieldRegen),
    shieldDamagedDelay: ship.shieldDamagedDelay ?? ship.shieldCooldown ?? 5,
    shieldDownedDelay: ship.shieldDownedDelay ?? (ship.shieldCooldown ?? 5) * 2,
    speedSCM: finiteRounded(vehicle.speed?.scm, ship.speedSCM),
    speedBoost: finiteRounded(vehicle.speed?.max, ship.speedBoost),
    accuracy: realAccuracy(vehicle, hardpoints, ship.accuracy),
    evasion: realEvasion(vehicle, sigCS, ship.evasion, maneuverProfile),
    boostForward: maneuverProfile.boostForward,
    boostBackward: maneuverProfile.boostBackward,
    zeroToScm: maneuverProfile.zeroToScm,
    zeroToMax: maneuverProfile.zeroToMax,
    verticalThrusterScore: maneuverProfile.verticalThrusterScore,
    lateralThrusterScore: maneuverProfile.lateralThrusterScore,
    strafeThrusterScore: maneuverProfile.strafeThrusterScore,
    boostThrusterScore: maneuverProfile.boostThrusterScore,
    thrusterScore: maneuverProfile.thrusterScore,
    radarStrength: realRadarStrength(vehicle),
    sigEM,
    sigIR,
    sigCS,
    signatureProfile: round2(clamp(0.30, 0.42 * sigEM + 0.33 * sigIR + 0.25 * sigCS, 3.00)),
    armorHealth: vehicle.armor?.health,
    armorDamageMultipliers: vehicle.armor?.damageMultipliers,
    armorResistanceMultipliers: vehicle.armor?.resistanceMultipliers,
    armorSignalMultipliers: vehicle.armor?.signalMultipliers,
    armorDeflection: vehicle.armor?.deflection,
    shieldResistance: vehicle.shieldResistance,
    shieldAbsorption: vehicle.shieldAbsorption,
    shieldFaceType: vehicle.shieldFaceType,
    vitalHullMax: bodyHullHpForShip(ship.id, vehicle, ship.hullMax),
    vitalTargetChance: derivedVitalTargetChance(vehicle),
    realVehicle: vehicle,
    shipDataSource: 'real',
    shipDataVersion: vehicle.sourceVersion ?? VEHICLE_DATA_META.gameVersion,
    shipSourceUrl: vehicle.sourceUrl,
  }
}

function realVehicleForShip(ship) {
  const slug = SHIP_API_SLUG_OVERRIDES[ship.id] ?? String(ship.id ?? '').replaceAll('_', '-')
  return REAL_VEHICLE_CATALOG[slug] ?? null
}

function realStockLoadout(vehicle, fallback = []) {
  const fixedWeapons = vehicle.weaponry?.fixedWeapons
  if (!Array.isArray(fixedWeapons) || fixedWeapons.length === 0) return Array.isArray(fallback) ? fallback : []

  const counts = fixedWeapons.reduce((acc, weapon) => {
    const weaponId = catalogIdForWeaponName(weapon.name)
    if (!weaponId) return acc
    acc[weaponId] = (acc[weaponId] ?? 0) + 1
    return acc
  }, {})

  const mounts = Object.entries(counts).map(([weaponId, count]) => weaponMount(weaponId, count))
  return mounts.length > 0 ? mounts : Array.isArray(fallback) ? fallback : []
}

function catalogIdForWeaponName(name) {
  const target = normalizeNameForMatch(name)
  if (!target) return null
  const match = Object.values(WEAPON_CATALOG)
    .find(weapon => normalizeNameForMatch(weapon.name) === target)
  return match?.id ?? null
}

function normalizeNameForMatch(name) {
  return String(name ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function simSizeFromVehicle(vehicle, fallback) {
  const sizeClass = Number(vehicle.sizeClass)
  if (!Number.isFinite(sizeClass)) return fallback
  if (sizeClass <= 1) return 'XS'
  if (sizeClass <= 2) return 'S'
  if (sizeClass <= 3) return 'M'
  return 'L'
}

function normalizeSignature(value, baseline) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 1
  return round2(clamp(0.30, n / baseline, 3.00))
}

function finiteRounded(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? round1(n) : fallback
}

function bodyHullHpForShip(shipId, vehicle, fallbackHullMax = 0) {
  const override = Number(BODY_HP_OVERRIDES[shipId])
  if (Number.isFinite(override) && override > 0) return override
  return derivedVitalHullHp(vehicle, fallbackHullMax)
}

function derivedVitalHullHp(vehicle, fallbackHullMax = 0) {
  const hullHp = Number(vehicle?.hullHp) || Number(fallbackHullMax) || 0
  if (hullHp <= 0) return null

  const armorHp = Number(vehicle?.armor?.health) || 0
  const sizeClass = Number(vehicle?.sizeClass) || 2
  const volume = vehicleVolume({ dimensions: vehicle?.dimensions })
  const volumeFactor = normalizedLogFactor(volume, 700, 9000)

  if (armorHp > 0) {
    const armorFactor = 0.53 + sizeClass * 0.015 + volumeFactor * 0.03
    return Math.round(clamp(hullHp * 0.18, armorHp * armorFactor, hullHp * 0.42))
  }

  const fallbackFactor = 0.24 + sizeClass * 0.04 + volumeFactor * 0.05
  return Math.round(clamp(hullHp * 0.18, hullHp * fallbackFactor, hullHp * 0.42))
}

function derivedVitalTargetChance(vehicle) {
  const sizeClass = Number(vehicle?.sizeClass) || 2
  const dimensions = vehicle?.dimensions ?? {}
  const planformArea = Math.max(1, (Number(dimensions.length) || 20) * (Number(dimensions.width) || 15))
  const crossSection = Number(vehicle?.crossSection?.max) || 0
  const areaFactor = normalizedLogFactor(planformArea, 180, 900)
  const crossSectionFactor = normalizedLogFactor(crossSection, 150, 3500)
  return round3(clamp(0.14, 0.14 + sizeClass * 0.015 + areaFactor * 0.11 + crossSectionFactor * 0.07, 0.36))
}

function normalizedLogFactor(value, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= min) return 0
  const low = Math.log(Math.max(1, min))
  const high = Math.log(Math.max(min + 1, max))
  const current = Math.log(Math.max(1, n))
  if (high <= low) return 0
  return clamp(0, (current - low) / (high - low), 1)
}

function realRadarStrength(vehicle) {
  const radar = (vehicle.components ?? []).find(component => component.type === 'radar')
  const sizeClass = Number(vehicle.sizeClass) || 2
  const radarSize = componentSizeRank(radar?.componentSize ?? radar?.size)
  return round2(clamp(0.75, 0.82 + sizeClass * 0.05 + radarSize * 0.06, 1.55))
}

function componentSizeRank(size) {
  const s = String(size ?? '').toUpperCase()
  if (s === 'XS') return 0.5
  if (s === 'S') return 1
  if (s === 'M') return 2
  if (s === 'L') return 3
  const n = Number(s)
  return Number.isFinite(n) ? Math.max(0.5, n) : 1
}

function realAccuracy(vehicle, hardpoints, fallback) {
  const pitch = Number(vehicle.agility?.pitch)
  const yaw = Number(vehicle.agility?.yaw)
  const turn = Number.isFinite(pitch) && Number.isFinite(yaw) ? (pitch + yaw) / 2 : 55
  const hardpointCount = Object.values(hardpoints ?? {}).reduce((sum, count) => sum + (Number(count) || 0), 0)
  const value = 0.58 + (turn / 80) * 0.12 + Math.min(0.06, hardpointCount * 0.01)
  return round2(clamp(0.55, value, 0.82) || fallback)
}

function realEvasion(vehicle, sigCS, fallback, maneuverProfile = realManeuverProfile(vehicle)) {
  const pitch = Number(vehicle.agility?.pitch)
  const yaw = Number(vehicle.agility?.yaw)
  const scm = Number(vehicle.speed?.scm)
  const turn = Number.isFinite(pitch) && Number.isFinite(yaw) ? (pitch + yaw) / 2 : 50
  const speed = Number.isFinite(scm) ? scm : 220
  const totalMass = Number(vehicle.mass?.total) || Number(vehicle.mass?.hull) || 60000
  const volume = vehicleVolume(vehicle)
  const durability = (Number(vehicle.hullHp) || 0) + (Number(vehicle.shieldHp) || 0)

  const turnScore = clamp(0, (turn - 28) / 42, 1)
  const speedScore = clamp(0, (speed - 170) / 70, 1)
  const massPenalty = logPenalty(totalMass, 55000, 150000, 0.055)
  const volumePenalty = logPenalty(volume, 2100, 4100, 0.035)
  const durabilityPenalty = logPenalty(durability, 14000, 85000, 0.055)
  const signaturePenalty = clamp(0, (sigCS - 0.85) * 0.04, 0.05)

  const value = 0.13
    + turnScore * 0.09
    + speedScore * 0.035
    + maneuverProfile.strafeThrusterScore * 0.075
    + maneuverProfile.boostThrusterScore * 0.035
    + maneuverProfile.rollThrusterScore * 0.025
    - massPenalty
    - volumePenalty
    - durabilityPenalty
    - signaturePenalty

  return round2(clamp(0.14, value, 0.48) || fallback)
}

function realManeuverProfile(vehicle) {
  const speed = vehicle.speed ?? {}
  const agility = vehicle.agility ?? {}
  const boostForward = Number(speed.boostForward) || 0
  const boostBackward = Number(speed.boostBackward) || 0
  const zeroToScm = Number(speed.zeroToScm)
  const zeroToMax = Number(speed.zeroToMax)
  const pitchBoosted = Number(agility.pitchBoosted) || (Number(agility.pitch) || 50) * 1.2
  const yawBoosted = Number(agility.yawBoosted) || (Number(agility.yaw) || 50) * 1.2
  const rollBoosted = Number(agility.rollBoosted) || (Number(agility.roll) || 120) * 1.2
  const accelScore = clamp(0, (5.5 - (Number.isFinite(zeroToScm) ? zeroToScm : 3.5)) / 4, 1)
  const forwardBoostScore = clamp(0, (boostForward - 320) / 280, 1)
  const brakeBoostScore = clamp(0, (boostBackward - 160) / 130, 1)
  const verticalThrusterScore = clamp(0, (pitchBoosted - 45) / 45, 1)
  const lateralThrusterScore = clamp(0, (yawBoosted - 38) / 42, 1)
  const rollThrusterScore = clamp(0, (rollBoosted - 110) / 140, 1)
  const strafeThrusterScore = clamp(
    0,
    lateralThrusterScore * 0.38 + verticalThrusterScore * 0.38 + brakeBoostScore * 0.14 + accelScore * 0.10,
    1
  )
  const boostThrusterScore = clamp(
    0,
    forwardBoostScore * 0.45 + brakeBoostScore * 0.30 + accelScore * 0.25,
    1
  )
  const thrusterScore = clamp(
    0,
    strafeThrusterScore * 0.58 + boostThrusterScore * 0.24 + rollThrusterScore * 0.18,
    1
  )

  return {
    boostForward: Math.round(boostForward),
    boostBackward: Math.round(boostBackward),
    zeroToScm: Number.isFinite(zeroToScm) ? round2(zeroToScm) : null,
    zeroToMax: Number.isFinite(zeroToMax) ? round2(zeroToMax) : null,
    verticalThrusterScore: round2(verticalThrusterScore),
    lateralThrusterScore: round2(lateralThrusterScore),
    rollThrusterScore: round2(rollThrusterScore),
    strafeThrusterScore: round2(strafeThrusterScore),
    boostThrusterScore: round2(boostThrusterScore),
    thrusterScore: round2(thrusterScore),
  }
}

function vehicleVolume(vehicle) {
  const dimensions = vehicle.dimensions ?? {}
  const length = Number(dimensions.length) || 20
  const width = Number(dimensions.width) || 15
  const height = Number(dimensions.height) || 6
  return length * width * height
}

function logPenalty(value, neutral, heavy, maxPenalty) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= neutral) return 0
  const denominator = Math.log(heavy / neutral)
  if (!Number.isFinite(denominator) || denominator <= 0) return 0
  return clamp(0, (Math.log(n / neutral) / denominator) * maxPenalty, maxPenalty)
}

function withWeaponDefaults(ship, selectedLoadoutId = STOCK_LOADOUT_ID, customConfig = null) {
  const loadoutOptions = buildLoadoutOptions(ship, customConfig)
  const selectedLoadout = loadoutOptions.find(option => option.id === selectedLoadoutId) ?? loadoutOptions[0]
  const shipForLoadout = { ...ship, weaponLoadout: selectedLoadout.weaponLoadout }
  const weaponLoadout = normalizeWeaponLoadout(shipForLoadout)
  const weaponBank = calculateWeaponBank(ship, weaponLoadout)
  const legacyDps = Number(ship.legacyDps ?? ship.dps) || 0
  const dps = calibratedWeaponDps(weaponBank, legacyDps)

  return {
    ...ship,
    weapons: selectedLoadout.weapons,
    dps,
    legacyDps,
    dpsSource: weaponBank.dataSource,
    currentLoadout: {
      id: selectedLoadout.id,
      name: selectedLoadout.name,
      description: selectedLoadout.description,
      weapons: selectedLoadout.weapons,
    },
    loadoutOptions: loadoutOptions.map(({ id, name, description, weapons }) => ({
      id,
      name,
      description,
      weapons,
    })),
    weaponLoadout,
    weaponBank,
    weaponCapBase: weaponBank.capacity,
    weaponRegenBase: weaponBank.regenPerSec,
    weaponDrainBase: weaponBank.drainPerSec,
    weaponRangeM: weaponBank.rangeM,
    damageProfile: weaponBank.damageProfile,
  }
}

function buildLoadoutOptions(ship, customConfig = null) {
  const stockWeaponLoadout = Array.isArray(ship.weaponLoadout) ? ship.weaponLoadout : inferWeaponLoadout(ship)
  const stockSlots = baseWeaponSlotsForShip(ship)
  const stock = {
    id: STOCK_LOADOUT_ID,
    name: 'Loadout base',
    description: 'Configuración base cargada desde los datos de la nave.',
    weaponLoadout: stockWeaponLoadout,
    weapons: stockSlots.length > 0
      ? describeWeaponSlots(stockSlots)
      : describeLoadoutWeapons(stockWeaponLoadout),
  }

  const variants = LOADOUT_PRESETS
    .map((preset) => {
      const weaponLoadout = loadoutFromHardpoints(ship, preset.bySize)
      if (!coversAllHardpoints(ship, weaponLoadout)) return null
      return {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        weaponLoadout,
        weapons: describeLoadoutWeapons(weaponLoadout),
      }
    })
    .filter(Boolean)

  const custom = buildCustomWeaponLoadout(ship, customConfig)

  return custom ? [stock, custom, ...variants] : [stock, ...variants]
}

function buildCustomWeaponLoadout(ship, customConfig) {
  const selected = customConfig?.weaponsBySlot
  if (!selected || Object.keys(selected).length === 0) return null

  const slots = baseWeaponSlotsForShip(ship)
    .map((slot) => {
      const selectedWeapon = WEAPON_CATALOG[selected[slot.id]]
      const selectedWeaponId = selectedWeapon && Number(selectedWeapon.size) === Number(slot.size)
        ? selectedWeapon.id
        : null
      const weaponId = selectedWeaponId ?? slot.baseWeaponId
      if (!weaponId) return null

      return {
        ...slot,
        weaponId,
        mount: slot.baseMount ?? 'fixed',
      }
    })
    .filter(Boolean)

  if (slots.length === 0) return null

  const hasChanges = slots.some(slot => slot.weaponId !== slot.baseWeaponId)
  if (!hasChanges) return null

  const weaponLoadout = aggregateWeaponSlots(slots)

  return {
    id: CUSTOM_LOADOUT_ID,
    name: 'Personalizado',
    description: 'Armas elegidas manualmente para cada espacio compatible de la nave.',
    weaponLoadout,
    weapons: describeWeaponSlots(slots),
  }
}

function baseWeaponSlotsForShip(ship) {
  const slots = hardpointSlotsForShip(ship)
  const stockLoadout = Array.isArray(ship.weaponLoadout) ? ship.weaponLoadout : inferWeaponLoadout(ship)
  const stockPool = expandWeaponMounts(stockLoadout)

  return slots
    .map((slot, index) => {
      const stockIndex = stockPool.findIndex(mount => Number(WEAPON_CATALOG[mount.weaponId]?.size) === Number(slot.size))
      const stockMount = stockIndex >= 0 ? stockPool.splice(stockIndex, 1)[0] : null
      const fallbackWeaponId = weaponOptionsForSize(slot.size)[0]?.id ?? null
      const baseWeaponId = stockMount?.weaponId ?? fallbackWeaponId
      const baseWeapon = WEAPON_CATALOG[baseWeaponId]

      if (!baseWeapon) return null

      return {
        ...slot,
        index: index + 1,
        label: `Arma ${index + 1} · S${slot.size}`,
        baseWeaponId,
        baseWeaponName: baseWeapon.name,
        baseMount: stockMount?.mount ?? 'fixed',
        weaponId: baseWeaponId,
        mount: stockMount?.mount ?? 'fixed',
      }
    })
    .filter(Boolean)
}

function hardpointSlotsForShip(ship) {
  let slotNumber = 0

  return Object.entries(ship.hardpoints ?? {})
    .map(([sizeKey, count]) => {
      const size = Number(String(sizeKey).replace('S', '')) || 0
      return {
        size,
        count: Math.max(1, Number(count) || 1),
      }
    })
    .filter(entry => entry.size > 0)
    .sort((a, b) => a.size - b.size)
    .flatMap(({ size, count }) => Array.from({ length: count }).map(() => {
      slotNumber += 1
      return {
        id: `weapon-${slotNumber}`,
        size,
      }
    }))
}

function expandWeaponMounts(weaponLoadout) {
  return (Array.isArray(weaponLoadout) ? weaponLoadout : [])
    .flatMap((mount) => {
      const count = Math.max(1, Number(mount.count) || 1)
      return Array.from({ length: count }).map(() => ({
        weaponId: mount.weaponId,
        mount: mount.mount ?? 'fixed',
      }))
    })
}

function aggregateWeaponSlots(slots) {
  const grouped = new Map()

  slots.forEach((slot) => {
    const key = `${slot.weaponId}|${slot.mount ?? 'fixed'}`
    const current = grouped.get(key) ?? {
      weaponId: slot.weaponId,
      count: 0,
      mount: slot.mount ?? 'fixed',
    }
    current.count += 1
    grouped.set(key, current)
  })

  return Array.from(grouped.values()).map(({ weaponId, count, mount }) => weaponMount(weaponId, count, mount))
}

function loadoutFromHardpoints(ship, weaponBySize) {
  return Object.entries(ship.hardpoints ?? {})
    .map(([sizeKey, count]) => {
      const size = Number(String(sizeKey).replace('S', '')) || 0
      const weaponId = weaponBySize[size]
      return weaponId && WEAPON_CATALOG[weaponId] ? weaponMount(weaponId, count) : null
    })
    .filter(Boolean)
}

function coversAllHardpoints(ship, weaponLoadout) {
  const hardpointTypes = Object.keys(ship.hardpoints ?? {})
  return hardpointTypes.length > 0 && weaponLoadout.length === hardpointTypes.length
}

function describeLoadoutWeapons(weaponLoadout) {
  return weaponLoadout.map((mount) => {
    const weapon = WEAPON_CATALOG[mount.weaponId]
    const count = Math.max(1, Number(mount.count) || 1)
    if (!weapon) return `${mount.weaponId} ×${count}`
    return `${weapon.name} ×${count} (S${weapon.size})`
  })
}

function describeWeaponSlots(slots) {
  return slots.map((slot) => {
    const weapon = WEAPON_CATALOG[slot.weaponId ?? slot.baseWeaponId]
    const weaponName = weapon?.name ?? slot.weaponId ?? 'Arma'
    const mountLabel = slot.mount === 'turret' ? ' · torreta' : ''
    return `${slot.label}: ${weaponName}${mountLabel}`
  })
}

export function getShipForLoadout(shipId, loadoutId = STOCK_LOADOUT_ID, customConfig = null) {
  const baseShip = withPowerPlantDefaults(withArmorDefaults(withRealVehicleDefaults(BASE_SHIPS[shipId] ?? BASE_SHIPS.aegs_gladius)))
  const componentShip = withComponentOverrides(baseShip, customConfig)
  const weaponShip = withWeaponDefaults(componentShip, loadoutId, customConfig)
  const resolvedShip = withCombatMetrics(withSensorDefaults(weaponShip))

  return {
    ...resolvedShip,
    configurationSlots: buildConfigurationSlots(baseShip, customConfig),
  }
}

function withArmorDefaults(ship) {
  const realPhysicalMultiplier = Number(ship.armorDamageMultipliers?.physical)
  const realEnergyMultiplier = Number(ship.armorDamageMultipliers?.energy)
  const fallbackReduction = fallbackArmorReductionForShip(ship)
  const armorReduction = Number.isFinite(realPhysicalMultiplier) && realPhysicalMultiplier > 0
    ? clamp(0.04, 1 - realPhysicalMultiplier, 0.28)
    : fallbackReduction

  return {
    ...ship,
    armorReduction: round2(armorReduction),
    armorReductionPct: Math.round(armorReduction * 100),
    armorPhysicalMultiplier: Number.isFinite(realPhysicalMultiplier) && realPhysicalMultiplier > 0
      ? round2(realPhysicalMultiplier)
      : round2(1 - fallbackReduction),
    armorEnergyMultiplier: Number.isFinite(realEnergyMultiplier) && realEnergyMultiplier > 0
      ? round2(realEnergyMultiplier)
      : null,
    armorDeflectionPhysical: Number(ship.armorDeflection?.physical) || 0,
    armorDeflectionEnergy: Number(ship.armorDeflection?.energy) || 0,
  }
}

function fallbackArmorReductionForShip(ship) {
  const sizeBase = {
    XS: 0.04,
    S: 0.08,
    M: 0.14,
    L: 0.22,
  }[ship?.size ?? 'S'] ?? 0.08
  const hullBonus = Math.min(0.08, (Number(ship?.hullMax) || 0) / 18000)
  return clamp(0.04, sizeBase + hullBonus, 0.28)
}

function withPowerPlantDefaults(ship) {
  const powerSlots = componentSlotsForShip(ship).filter(slot => slot.type === 'power_plants')
  const baselineOutput = powerSlots.reduce((sum, slot) => sum + baselinePowerOutputForSlot(slot), 0)

  if (baselineOutput <= 0) return ship

  return {
    ...ship,
    powerPlantBaselineOutput: round1(baselineOutput),
    powerPlantOutput: round1(baselineOutput),
    powerPlantSource: 'Base de nave',
  }
}

function withComponentOverrides(ship, customConfig) {
  const selectedComponents = resolveSelectedComponents(ship, customConfig)
  if (selectedComponents.length === 0) {
    return {
      ...ship,
      selectedComponents: [],
      componentLoadoutSummary: [],
    }
  }

  const next = { ...ship }
  const summary = []

  selectedComponents.forEach(({ slot, component }) => {
    const mounts = Math.max(1, Number(slot.mounts) || 1)
    summary.push({
      type: slot.type,
      label: COMPONENT_TYPE_LABELS[slot.type] ?? slot.type,
      size: slot.size,
      mounts,
      componentId: component.id,
      name: component.name,
      detail: componentDetail(component, mounts),
    })

    if (slot.type === 'shield_generators' && component.shield) {
      const damagedDelay = Number(component.shield.damagedDelay) || next.shieldDamagedDelay || next.shieldCooldown || 5
      const downedDelay = Number(component.shield.downedDelay) || next.shieldDownedDelay || damagedDelay * 2
      next.shieldMax = round1((Number(component.shield.maxHealth) || next.shieldMax / mounts) * mounts)
      next.shieldRegen = round1((Number(component.shield.regenRate) || next.shieldRegen / mounts) * mounts)
      next.shieldDamagedDelay = round1(damagedDelay)
      next.shieldDownedDelay = round1(downedDelay)
      next.shieldCooldown = next.shieldDamagedDelay
      next.shieldResistance = component.shield.resistance ?? next.shieldResistance
      next.shieldAbsorption = component.shield.absorption ?? next.shieldAbsorption
      next.shieldSource = component.name
    }

    if (slot.type === 'radar' && component.radar) {
      next.radarStrength = radarStrengthForComponent(component, ship)
      next.radarSource = component.name
    }

    if (slot.type === 'power_plants') {
      const output = componentPowerOutput(component) * mounts
      const baseline = Number(ship.powerPlantBaselineOutput) || baselinePowerOutputForSlot(slot)
      if (output > 0) {
        next.powerPlantOutput = round1(output)
        next.powerPlantBaselineOutput = round1(baseline || output)
        next.powerPlantSource = component.name
      }
    }
  })

  const emission = selectedComponentEmission(selectedComponents)
  if (emission.em > 0) {
    next.sigEM = round2(clamp(0.30, (Number(ship.sigEM) || 1) * 0.55 + normalizeSignature(emission.em, 12000) * 0.45, 3.00))
  }
  if (emission.ir > 0) {
    next.sigIR = round2(clamp(0.30, (Number(ship.sigIR) || 1) * 0.65 + normalizeSignature(emission.ir, 8000) * 0.35, 3.00))
  }

  return {
    ...next,
    selectedComponents,
    componentLoadoutSummary: summary,
  }
}

function resolveSelectedComponents(ship, customConfig) {
  const selections = customConfig?.components ?? {}
  if (!selections || Object.keys(selections).length === 0) return []

  return componentSlotsForShip(ship)
    .map((slot) => {
      const component = componentById(selections[slot.type])
      if (!component || component.type !== slot.type || Number(component.size) !== Number(slot.size)) return null
      return { slot, component }
    })
    .filter(Boolean)
}

function componentSlotsForShip(ship) {
  const components = Array.isArray(ship.realVehicle?.components) ? ship.realVehicle.components : []
  return components
    .filter(component => CONFIGURABLE_COMPONENT_TYPES.includes(component.type))
    .map(component => {
      const size = componentSizeNumber(component.componentSize ?? component.size)
      if (!Number.isFinite(size) || size <= 0) return null
      return {
        type: component.type,
        label: COMPONENT_TYPE_LABELS[component.type] ?? component.name ?? component.type,
        size,
        mounts: Math.max(1, Number(component.mounts) || Number(component.quantity) || 1),
      }
    })
    .filter(Boolean)
}

function baselinePowerOutputForSlot(slot) {
  const mounts = Math.max(1, Number(slot.mounts) || 1)
  const outputs = componentOptionsForSlot(slot.type, slot.size)
    .map(componentPowerOutput)
    .filter(output => output > 0)
    .sort((a, b) => a - b)

  if (outputs.length === 0) return fallbackPowerOutputForSlot(slot) * mounts

  const mid = Math.floor(outputs.length / 2)
  const median = outputs.length % 2 === 0
    ? (outputs[mid - 1] + outputs[mid]) / 2
    : outputs[mid]
  return median * mounts
}

function fallbackPowerOutputForSlot(slot) {
  const size = Number(slot.size) || 1
  return 12 + size * 4
}

function componentPowerOutput(component) {
  const powerOutput = Number(component?.powerPlant?.powerOutput)
  if (Number.isFinite(powerOutput) && powerOutput > 0) return powerOutput

  const generatedPower = Number(component?.resource?.generation?.power)
  if (Number.isFinite(generatedPower) && generatedPower > 0) return generatedPower

  const maxPower = Number(component?.resource?.usage?.powerMax)
  return Number.isFinite(maxPower) && maxPower > 0 ? maxPower : 0
}

function buildConfigurationSlots(ship, customConfig) {
  const weaponSelections = customConfig?.weaponsBySlot ?? {}
  const componentSelections = customConfig?.components ?? {}

  return {
    weapons: baseWeaponSlotsForShip(ship)
      .map((slot) => {
        const selectedWeapon = WEAPON_CATALOG[weaponSelections[slot.id]]
        const selectedId = selectedWeapon && Number(selectedWeapon.size) === Number(slot.size)
          ? selectedWeapon.id
          : ''
        const loadedWeaponId = selectedId || slot.baseWeaponId
        const loadedWeapon = WEAPON_CATALOG[loadedWeaponId]

        return {
          ...slot,
          selectedId: selectedId && selectedId !== slot.baseWeaponId ? selectedId : '',
          selectedWeaponId: loadedWeaponId,
          selectedWeaponName: loadedWeapon?.name ?? slot.baseWeaponName,
          baseWeaponLabel: slot.baseWeaponName,
          options: weaponOptionsForSize(slot.size)
            .filter(option => option.id !== slot.baseWeaponId && option.name !== slot.baseWeaponName),
        }
      })
      .filter(slot => slot.size > 0 && slot.baseWeaponId),
    components: componentSlotsForShip(ship).map((slot) => {
      const baseComponent = inferredBaseComponentForSlot(ship, slot)
      const options = componentOptionsForSlot(slot.type, slot.size).map(component => ({
        id: component.id,
        name: component.name,
        label: componentLabel(component),
        detail: componentDetail(component, slot.mounts),
      }))

      return {
        ...slot,
        selectedId: componentSelections[slot.type] ?? '',
        baseComponentId: baseComponent?.id ?? '',
        baseComponentLabel: baseComponent ? componentLabel(baseComponent) : `${slot.label} base S${slot.size}`,
        options: baseComponent
          ? options.filter(option => option.id !== baseComponent.id)
          : options,
      }
    }),
  }
}

function inferredBaseComponentForSlot(ship, slot) {
  const options = componentOptionsForSlot(slot.type, slot.size)
  if (options.length === 0) return null

  if (slot.type === 'shield_generators') {
    return closestComponent(options, component => {
      const mounts = Math.max(1, Number(slot.mounts) || 1)
      const maxHealth = (Number(component.shield?.maxHealth) || 0) * mounts
      const regen = (Number(component.shield?.regenRate) || 0) * mounts
      const healthScore = relativeDiff(maxHealth, ship.shieldMax)
      const regenScore = relativeDiff(regen, ship.shieldRegen)
      return healthScore * 0.7 + regenScore * 0.3
    })
  }

  if (slot.type === 'radar') {
    return closestComponent(options, component => {
      const strength = radarStrengthForComponent(component, ship)
      return relativeDiff(strength, ship.radarStrength)
    })
  }

  return null
}

function closestComponent(options, scoreForComponent) {
  return options.reduce((best, component) => {
    const score = scoreForComponent(component)
    if (!best || score < best.score) return { component, score }
    return best
  }, null)?.component ?? null
}

function relativeDiff(value, target) {
  const v = Number(value)
  const t = Number(target)
  if (!Number.isFinite(v) || !Number.isFinite(t) || t === 0) return Number.MAX_SAFE_INTEGER
  return Math.abs(v - t) / Math.abs(t)
}

function weaponOptionsForSize(size) {
  const seen = new Set()

  return Object.values(WEAPON_CATALOG)
    .filter(weapon => weapon.source === 'real')
    .filter(weapon => Number(weapon.size) === Number(size))
    .sort((a, b) => {
      const typeCompare = String(a.type ?? '').localeCompare(String(b.type ?? ''))
      if (typeCompare !== 0) return typeCompare
      return String(a.name ?? '').localeCompare(String(b.name ?? ''))
    })
    .filter((weapon) => {
      const key = `${normalizeNameForMatch(weapon.name)}|${weapon.type}|${weapon.size}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(weapon => ({
      id: weapon.id,
      name: weapon.name,
      label: `${weapon.name} · ${weapon.type} · DPS ${Math.round(Number(weapon.burstDps) || 0)}`,
      detail: `${weapon.type} · ${Math.round(Number(weapon.range) || 0)}m · ${Number(weapon.ammo) > 0 ? `${weapon.ammo} mun.` : 'energía'}`,
    }))
}

function componentDetail(component, mounts = 1) {
  const count = Math.max(1, Number(mounts) || 1)
  if (component.type === 'shield_generators' && component.shield) {
    return `${Math.round((Number(component.shield.maxHealth) || 0) * count)} HP · ${Math.round((Number(component.shield.regenRate) || 0) * count)}/s`
  }
  if (component.type === 'power_plants') {
    return `${Math.round(Number(component.powerPlant?.powerOutput) || Number(component.resource?.generation?.power) || 0)} energía · EM ${Math.round(Number(component.emission?.emMax) || 0)}`
  }
  if (component.type === 'coolers') {
    return `${Math.round(Number(component.cooler?.coolingRate) || Number(component.resource?.generation?.coolant) || 0)} refrigeración · IR ${Math.round(Number(component.emission?.ir) || 0)}`
  }
  if (component.type === 'radar') {
    const sensitivity = radarSensitivity(component)
    const maxAssist = Math.round(Number(component.radar?.aimAssist?.maxDistance) || 0)
    return `sens. ${sensitivity.toFixed(2)} · ayuda ${maxAssist}m`
  }
  return `${component.typeLabel ?? 'Componente'} S${component.size}`
}

function powerPlantWeaponSupport(ship) {
  const output = Number(ship?.powerPlantOutput)
  const baseline = Number(ship?.powerPlantBaselineOutput)
  if (!Number.isFinite(output) || output <= 0 || !Number.isFinite(baseline) || baseline <= 0) {
    return {
      output: 0,
      baseline: 0,
      energyRatio: 1,
      capacityMult: 1,
      regenMult: 1,
      drainMult: 1,
    }
  }

  const energyRatio = clamp(0.75, output / baseline, 1.25)

  return {
    output: round1(output),
    baseline: round1(baseline),
    energyRatio: round2(energyRatio),
    capacityMult: round2(clamp(0.94, 1 + (energyRatio - 1) * 0.22, 1.08)),
    regenMult: round2(clamp(0.85, 1 + (energyRatio - 1) * 0.65, 1.18)),
    drainMult: round2(clamp(0.92, 1 - (energyRatio - 1) * 0.25, 1.10)),
  }
}

function selectedComponentEmission(selectedComponents) {
  return selectedComponents.reduce((acc, { slot, component }) => {
    const mounts = Math.max(1, Number(slot.mounts) || 1)
    acc.em += (Number(component.emission?.emMax) || 0) * mounts
    acc.ir += (Number(component.emission?.ir) || 0) * mounts
    return acc
  }, { em: 0, ir: 0 })
}

function radarStrengthForComponent(component, ship) {
  const sensitivity = radarSensitivity(component)
  const sizeBonus = (Number(component.size) || 1) * 0.06
  const assistBonus = (Number(component.radar?.aimAssist?.maxDistance) || 0) / 5000 * 0.14
  const base = Number(ship.radarStrength) || 1
  return round2(clamp(0.70, base * 0.55 + 0.55 + sensitivity * 0.28 + sizeBonus + assistBonus, 1.80))
}

function radarSensitivity(component) {
  const s = component.radar?.sensitivity ?? {}
  const values = [s.infrared, s.electromagnetic, s.crossSection, s.resource]
    .map(Number)
    .filter(Number.isFinite)
  if (values.length === 0) return 0.8
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function componentSizeNumber(size) {
  const s = String(size ?? '').toUpperCase()
  if (s === 'S') return 1
  if (s === 'M') return 2
  if (s === 'L') return 3
  if (s === 'C') return 4
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
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
        simBurstDps: (Number(weapon.burstDps) || 0) * count * WEAPON_DAMAGE_TO_SIM_SCALE,
        simAlpha: (Number(weapon.alpha) || 0) * WEAPON_DAMAGE_TO_SIM_SCALE,
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
  const powerPlant = powerPlantWeaponSupport(ship)

  const capWeapons = activeWeapons.filter(w => !isBallisticWeapon(w))
  const baseCapacity = capWeapons.reduce((sum, w) => sum + weaponCapacityUnits(w) * w.count, 0)
  const capacity = clamp(
    75,
    baseCapacity * powerPlant.capacityMult,
    190
  )
  const baseDrainPerSec = capWeapons.reduce((sum, w) => sum + weaponDrainPerSecond(w) * w.count, 0)
  const drainPerSec = clamp(
    0,
    baseDrainPerSec * powerPlant.drainMult,
    62
  )
  const baseRegenPerSec = realRegen > 0
    ? realRegen
    : 10 + totalCount * 0.65 + avgSize * 1.4 + Math.max(0, 260 - totalBurstDps) / 45 - powerDraw * 0.25
  const regenPerSec = clamp(
    10,
    baseRegenPerSec * powerPlant.regenMult,
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
    powerPlantOutput: powerPlant.output,
    powerPlantBaselineOutput: powerPlant.baseline,
    powerPlantEnergyRatio: powerPlant.energyRatio,
    powerPlantRegenMult: powerPlant.regenMult,
    powerPlantCapacityMult: powerPlant.capacityMult,
    powerPlantDrainMult: powerPlant.drainMult,
    powerPlantSource: ship.powerPlantSource ?? null,
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
  const simAlpha = Math.max(0, Number(weapon.simAlpha) || alpha * WEAPON_DAMAGE_TO_SIM_SCALE)
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
    simBurstDps: round1(burstDps * count * WEAPON_DAMAGE_TO_SIM_SCALE),
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

  const capacitorAmmo = Number(weapon.capacitorAmmo)
  if (Number.isFinite(capacitorAmmo) && capacitorAmmo > 0) {
    return weaponCapacityUnits(weapon) / capacitorAmmo
  }

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
  const explicitNear = Number(p.nearRadius)
  const explicitFar = Number(p.farRadius)
  const thickness = Number.isFinite(explicitThickness) && explicitThickness > 0
    ? explicitThickness
    : inferredPenetrationThickness(weapon)
  const baseDistance = Number.isFinite(explicitBase) && explicitBase > 0
    ? explicitBase
    : thickness * 0.35
  const nearRadius = Number.isFinite(explicitNear) && explicitNear > 0
    ? explicitNear
    : baseDistance * 0.05
  const farRadius = Number.isFinite(explicitFar) && explicitFar > 0
    ? explicitFar
    : Math.max(nearRadius, baseDistance * 0.10)

  return {
    thickness: round2(thickness),
    baseDistance: round2(baseDistance),
    nearRadius: round2(nearRadius),
    farRadius: round2(farRadius),
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
  if (isBallisticWeapon(weapon)) return 0

  const capacitorAmmo = Number(weapon.capacitorAmmo)
  const capacitorRpm = Number(weapon.rpm)
  if (Number.isFinite(capacitorAmmo) && capacitorAmmo > 0 && Number.isFinite(capacitorRpm) && capacitorRpm > 0) {
    return clamp(3, weaponCapCostPerShot(weapon) * (capacitorRpm / 60), 32)
  }

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
  const fallbackSigEM = clamp(
    0.35,
    (0.45 + (ship.dps ?? 0) / 360 * 0.28 + weaponEm * 0.18 + weaponPower * 0.10 + (ship.shieldRegen ?? 0) / 120 * 0.18 + (ship.shieldMax ?? 0) / 1800 * 0.12) * stealthEMIR,
    2.20
  )
  const fallbackSigIR = clamp(
    0.35,
    (0.45 + (ship.speedSCM ?? 0) / 280 * 0.24 + (ship.speedBoost ?? 0) / 1500 * 0.22 + (ship.dps ?? 0) / 500 * 0.10 + weaponPower * 0.08) * stealthEMIR,
    2.20
  )
  const baseSigEM = Number.isFinite(Number(ship.sigEM)) ? Number(ship.sigEM) : fallbackSigEM
  const baseSigIR = Number.isFinite(Number(ship.sigIR)) ? Number(ship.sigIR) : fallbackSigIR
  const sigEM = clamp(0.30, (baseSigEM + weaponEm * 0.10 + weaponPower * 0.06) * stealthEMIR, 3.00)
  const sigIR = clamp(0.30, (baseSigIR + weaponPower * 0.04) * stealthEMIR, 3.00)
  const sigCS = ship.sigCS ?? clamp(
    0.35,
    (d.sigCS + (ship.hullMax ?? 0) / 4000 * 0.20 + (ship.shieldMax ?? 0) / 4000 * 0.12 - (ship.evasion ?? 0.25) * 0.15) * stealthCS,
    3.50
  )
  const signatureProfile = clamp(0.30, 0.42 * sigEM + 0.33 * sigIR + 0.25 * sigCS, 3.00)

  return { ...ship, radarStrength, sigEM, sigIR, sigCS, signatureProfile }
}

function withCombatMetrics(ship) {
  const weaponry = weaponryMetricsForShip(ship)
  const armor = armorMetricsForShip(ship)
  const flight = flightMetricsForShip(ship)
  const computed = computedCombatMetricsForShip(ship)
  const hasEstimatedFlight = Boolean(flight.accelerations?.estimated)
  const shipDisplaySource = ship.shipDataSource === 'real' && hasEstimatedFlight ? 'mixed' : ship.shipDataSource ?? 'mock'

  return {
    ...ship,
    combatMetrics: {
      displaySource: shipDisplaySource,
      hull: {
        dimensionsLabel: dimensionLabelForShip(ship),
        massKg: Math.round(Number(ship.realVehicle?.mass?.hull) || Number(ship.realVehicle?.mass?.total) || 0),
        totalHealthHp: Math.round(Number(ship.hullMax) || 0),
        bodyHp: Math.round(Number(ship.vitalHullMax) || 0),
      },
      weaponry,
      armor,
      flight,
      computed,
    },
  }
}

function weaponryMetricsForShip(ship) {
  const weaponMetrics = loadoutWeaponMetrics(ship)
  const missileCount = Math.round(Number(ship.realVehicle?.weaponry?.missileCount) || 0)
  const missileDamage = Math.round(Number(ship.realVehicle?.weaponry?.totalMissileDamage) || 0)
  const ammoCapacity = Math.round(Number(ship.weaponBank?.ammoCapacity) || 0)
  const ballisticWeaponCount = Math.round(Number(ship.weaponBank?.ballisticWeaponCount) || 0)

  return {
    pilotBurstDps: Math.round(weaponMetrics.burstDps),
    pilotSustainedDps: Math.round(weaponMetrics.sustainedDps),
    pilotAlpha: round1(weaponMetrics.alpha),
    dpsSource: weaponMetrics.source,
    shieldBubbleHp: Math.round(Number(ship.shieldMax) || 0),
    missileCount,
    missileDamage,
    ballisticAmmo: ballisticWeaponCount > 0 ? ammoCapacity : null,
    ballisticWeaponCount,
  }
}

function armorMetricsForShip(ship) {
  const armor = ship.realVehicle?.armor ?? {}
  const damageMultipliers = armor.damageMultipliers ?? {}
  const resistanceMultipliers = armor.resistanceMultipliers ?? {}
  const signalMultipliers = armor.signalMultipliers ?? {}
  const penetrationResistance = armor.penetrationResistance ?? {}
  const hullHp = Number(ship.hullMax) || 0
  const physicalMultiplier = Number(damageMultipliers.physical)
  const energyMultiplier = Number(damageMultipliers.energy)

  return {
    apiHealthHp: Math.round(Number(armor.health) || 0),
    effectiveHullHp: {
      physical: Number.isFinite(physicalMultiplier) && physicalMultiplier > 0
        ? Math.round(hullHp / physicalMultiplier)
        : null,
      energy: Number.isFinite(energyMultiplier) && energyMultiplier > 0
        ? Math.round(hullHp / energyMultiplier)
        : null,
    },
    rawDamageMultipliers: {
      physical: Number.isFinite(physicalMultiplier) ? round2(physicalMultiplier) : null,
      energy: Number.isFinite(energyMultiplier) ? round2(energyMultiplier) : null,
    },
    damageModifiers: {
      physical: multiplierDeltaPct(damageMultipliers.physical),
      energy: multiplierDeltaPct(damageMultipliers.energy),
      distortion: multiplierDeltaPct(damageMultipliers.distortion),
    },
    durabilityModifiers: {
      physical: multiplierDeltaPct(resistanceMultipliers.physical),
      energy: multiplierDeltaPct(resistanceMultipliers.energy),
    },
    signatureModifiers: {
      electromagnetic: multiplierDeltaPct(signalMultipliers.electromagnetic),
      crossSection: multiplierDeltaPct(signalMultipliers.cross_section),
      infrared: multiplierDeltaPct(signalMultipliers.infrared),
    },
    deflection: {
      physical: Math.round(Number(ship.armorDeflectionPhysical) || 0),
      energy: Math.round(Number(ship.armorDeflectionEnergy) || 0),
    },
    penetrationResistance: {
      physical: multiplierDeltaPct(penetrationResistance.physical),
      energy: multiplierDeltaPct(penetrationResistance.energy),
    },
  }
}

function flightMetricsForShip(ship) {
  const speed = ship.realVehicle?.speed ?? {}
  const agility = ship.realVehicle?.agility ?? {}

  return {
    scm: Math.round(Number(ship.speedSCM) || 0),
    nav: Math.round(Number(ship.speedBoost) || 0),
    forwardBoost: Math.round(Number(ship.boostForward) || Number(speed.boostForward) || 0),
    backwardBoost: Math.round(Number(ship.boostBackward) || Number(speed.boostBackward) || 0),
    pitch: round1(Number(agility.pitch) || 0),
    yaw: round1(Number(agility.yaw) || 0),
    roll: round1(Number(agility.roll) || 0),
    pitchBoosted: round1(Number(agility.pitchBoosted) || 0),
    yawBoosted: round1(Number(agility.yawBoosted) || 0),
    rollBoosted: round1(Number(agility.rollBoosted) || 0),
    accelerations: estimatedAccelerationGs(ship),
  }
}

function computedCombatMetricsForShip(ship) {
  const turn = averageDefined(ship.realVehicle?.agility?.pitch, ship.realVehicle?.agility?.yaw)
  const turnScore = clamp(0, (turn - 28) / 42, 1)
  const maneuverability = clamp(0.14, turnScore * 0.42 + (Number(ship.thrusterScore) || 0) * 0.58, 1)

  return {
    precisionPct: Math.round((Number(ship.accuracy) || 0) * 100),
    evasionPct: Math.round((Number(ship.evasion) || 0) * 100),
    maneuverabilityPct: Math.round(maneuverability * 100),
    ballisticAmmo: Number(ship.weaponBank?.ballisticWeaponCount) > 0 ? Math.round(Number(ship.weaponBank?.ammoCapacity) || 0) : null,
  }
}

function loadoutWeaponMetrics(ship) {
  const mounts = Array.isArray(ship.weaponLoadout) ? ship.weaponLoadout : []
  let burst = 0
  let sustained = 0
  let alpha = 0
  let realMatches = 0
  let estimatedMatches = 0

  mounts.forEach((mount) => {
    const weapon = WEAPON_CATALOG[mount.weaponId ?? mount.id]
    if (!weapon) return
    const count = Math.max(1, Number(mount.count) || 1)
    const burstPerWeapon = Number(weapon.burstDps) || 0
    const sustainedEstimate = sustainedDpsForWeapon(weapon)
    burst += burstPerWeapon * count
    sustained += sustainedEstimate.value * count
    alpha += (Number(weapon.alpha) || 0) * count
    if (sustainedEstimate.source === 'real') realMatches += count
    else estimatedMatches += count
  })

  const source = estimatedMatches <= 0 ? 'real' : realMatches > 0 ? 'mixed' : 'estimated'
  return { burstDps: burst, sustainedDps: sustained, alpha, source }
}

function sustainedDpsForWeapon(weapon) {
  const lookup = weaponSustainedLookup()
  const match = lookup[weapon.id]
  if (match) return { value: Number(match.sustainedDps) || 0, source: 'real' }

  const burst = Number(weapon.burstDps) || 0
  const type = `${weapon.type ?? ''}`.toLowerCase()
  if (type.includes('ballistic cannon')) return { value: burst * 0.34, source: 'estimated' }
  if (type.includes('ballistic gatling')) return { value: burst * 0.74, source: 'estimated' }
  if (type.includes('ballistic')) return { value: burst * 0.62, source: 'estimated' }
  if (type.includes('laser cannon')) return { value: burst * 0.39, source: 'estimated' }
  if (type.includes('laser repeater')) return { value: burst * 0.54, source: 'estimated' }
  return { value: burst * 0.48, source: 'estimated' }
}

let WEAPON_SUSTAINED_LOOKUP_CACHE = null

function weaponSustainedLookup() {
  if (WEAPON_SUSTAINED_LOOKUP_CACHE) return WEAPON_SUSTAINED_LOOKUP_CACHE

  const aggregated = {}

  Object.values(REAL_VEHICLE_CATALOG).forEach((vehicle) => {
    const fixedWeapons = vehicle.weaponry?.fixedWeapons ?? []
    fixedWeapons.forEach((entry) => {
      const sustainedDps = Number(entry.sustainedDps)
      const burstDps = Number(entry.dps)
      if (!Number.isFinite(sustainedDps) || sustainedDps <= 0 || !Number.isFinite(burstDps) || burstDps <= 0) return
      const weaponId = catalogIdForWeaponName(entry.name)
      if (!weaponId) return

      const current = aggregated[weaponId] ?? { sustainedSum: 0, burstSum: 0, count: 0 }
      current.sustainedSum += sustainedDps
      current.burstSum += burstDps
      current.count += 1
      aggregated[weaponId] = current
    })
  })

  WEAPON_SUSTAINED_LOOKUP_CACHE = Object.fromEntries(Object.entries(aggregated).map(([weaponId, value]) => {
    const count = Math.max(1, Number(value.count) || 1)
    const sustainedDps = value.sustainedSum / count
    const burstDps = value.burstSum / count
    return [weaponId, {
      sustainedDps: round1(sustainedDps),
      burstDps: round1(burstDps),
      ratio: round3(sustainedDps / Math.max(1, burstDps)),
    }]
  }))

  return WEAPON_SUSTAINED_LOOKUP_CACHE
}

function estimatedAccelerationGs(ship) {
  const scm = Math.max(0, Number(ship.speedSCM) || 0)
  const boostForward = Math.max(0, Number(ship.boostForward) || 0)
  const boostBackward = Math.max(0, Number(ship.boostBackward) || 0)
  const zeroToScm = Number(ship.zeroToScm)
  const strafe = Number(ship.strafeThrusterScore) || 0
  const vertical = Number(ship.verticalThrusterScore) || 0

  if (!Number.isFinite(zeroToScm) || zeroToScm <= 0 || scm <= 0) {
    return { estimated: true, main: null, retro: null, up: null, down: null, strafe: null }
  }

  const baseMain = round1((scm / zeroToScm / 9.81) * 1.39)
  const boostMain = round1((Math.max(boostForward, scm) / zeroToScm / 9.81) * 0.94)
  const backwardRatio = boostForward > 0 ? clamp(0.22, boostBackward / boostForward, 0.75) : 0.5
  const retro = round1(baseMain * backwardRatio * 0.58)
  const retroBoosted = round1(boostMain * backwardRatio * 0.54)
  const up = round1(baseMain * clamp(0.45, vertical, 1) * 0.91)
  const upBoosted = round1(boostMain * clamp(0.45, vertical, 1) * 0.76)
  const down = round1(up * 0.5)
  const downBoosted = round1(upBoosted * 0.52)
  const strafeBase = round1(baseMain * clamp(0.35, strafe, 1) * 1.02)
  const strafeBoosted = round1(boostMain * clamp(0.35, strafe, 1) * 0.85)

  return {
    estimated: true,
    main: { base: baseMain, boosted: boostMain },
    retro: { base: retro, boosted: retroBoosted },
    up: { base: up, boosted: upBoosted },
    down: { base: down, boosted: downBoosted },
    strafe: { base: strafeBase, boosted: strafeBoosted },
  }
}

function dimensionLabelForShip(ship) {
  const dimensions = ship.realVehicle?.dimensions ?? {}
  const sizeClass = Number(ship.realVehicle?.sizeClass)
  const sizeLabel = Number.isFinite(sizeClass) ? `S${sizeClass}` : ship.size ?? 'S'
  const length = round1(Number(dimensions.length) || 0)
  const width = round1(Number(dimensions.width) || 0)
  const height = round1(Number(dimensions.height) || 0)
  if (length <= 0 || width <= 0 || height <= 0) return null
  return `(${sizeLabel}) ${formatCompactNumber(length)} L x ${formatCompactNumber(width)} W x ${formatCompactNumber(height)} H m`
}

function multiplierDeltaPct(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.round((n - 1) * 100)
}

function averageDefined(a, b) {
  const values = [Number(a), Number(b)].filter(value => Number.isFinite(value))
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function formatCompactNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
}

export const SHIPS = Object.fromEntries(
  Object.entries(BASE_SHIPS).map(([id, ship]) => {
    const realShip = withPowerPlantDefaults(withArmorDefaults(withRealVehicleDefaults(ship)))
    return [id, withCombatMetrics(withSensorDefaults(withWeaponDefaults(realShip)))]
  })
)

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
