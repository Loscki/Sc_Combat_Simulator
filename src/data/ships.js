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

export const SHIPS = {

  // ─── AEGIS DYNAMICS ───────────────────────────────────────────

  aegs_gladius: {
    id:             'aegs_gladius',
    name:           'Gladius',
    manufacturer:   'Aegis Dynamics',
    role:           'Fighter',
    size:           'S',
    weapons:        ['CF-227 Panther ×2 (S2)', 'CF-337 Panther ×1 (S3)'],
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
    weapons:        ['CF-117 Badger ×2 (S1)', 'CF-227 Panther ×1 (S2)'],
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
    weapons:        ['CF-117 Badger ×2 (S1)', 'CF-227 Panther ×1 (S2)', 'Misiles S2 ×4'],
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
    weapons:        ['CF-227 Panther ×2 (S2)'],
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
    weapons:        ['CF-227 Panther ×2 (S2)', 'CF-337 Panther ×1 (S3)', 'CF-227 Panther ×1 torreta'],
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
    weapons:        ['CF-227 Panther ×2 (S2)', 'CF-337 Panther ×2 (S3)', 'Turret CF-227 ×1 (S2)'],
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
    weapons:        ['CF-227 Panther ×2 (S2)', 'CF-337 Panther ×1 (S3)'],
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
    weapons:        ['CF-227 Panther ×2 (S2)', 'Misiles S2 ×4'],
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
    weapons:        ['Neutron Repeater ×2 (S2)', 'Laser Cannon ×1 (S3)', 'Laser Cannon ×2 (S2)'],
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
    weapons:        ['Laser Cannon ×2 (S1)'],
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
    weapons:        ['Laser Cannon ×2 (S1)', 'Misiles S2 ×4'],
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
    weapons:        ['Laser Cannon ×2 (S1)'],
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
    weapons:        ['Laser Cannon ×2 (S2)'],
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
    weapons:        ['Laser Repeater ×4 (S2)'],
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
    weapons:        ['Laser Repeater ×4 (S2)'],
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
  const sigEM = ship.sigEM ?? clamp(
    0.35,
    (0.45 + (ship.dps ?? 0) / 360 * 0.45 + (ship.shieldRegen ?? 0) / 120 * 0.18 + (ship.shieldMax ?? 0) / 1800 * 0.12) * stealthEMIR,
    2.20
  )
  const sigIR = ship.sigIR ?? clamp(
    0.35,
    (0.45 + (ship.speedSCM ?? 0) / 280 * 0.24 + (ship.speedBoost ?? 0) / 1500 * 0.22 + (ship.dps ?? 0) / 500 * 0.14) * stealthEMIR,
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
  SHIPS[id] = withSensorDefaults(SHIPS[id])
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
