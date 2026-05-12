import { adjustPilotSkillForShip, clampPilotSkill, PILOT_SKILL_CENTER } from '../lib/pilotMastery.js'

/**
 * combatEngine.js — Motor de simulación de combate
 *
 * Lógica pura: no importa React, no toca el DOM.
 * Recibe configuración, devuelve resultado completo.
 *
 * ─── MODELO ───────────────────────────────────────────────────
 * Tick rate : 0.1 segundos (TICK_RATE)
 * Daño:
 *   Cada grupo de armas dispara por RPM, alpha calibrado y tipo de daño.
 *
 * Tracking / time-on-target:
 *   - Estar en rango no garantiza aprovechar toda la ventana de fuego
 *   - El tracking ya no actúa como puerta binaria de disparo
 *   - En su lugar modula cuánto tiempo de esa ventana convierte el piloto en fuego real
 *   - Pilotos expertos aprovechan más ventana y sostienen mejor el tiro
 *
 * Capacitor de armas:
 *   - La capacidad/recarga/consumo vienen del banco de armas equipado
 *   - La planta de energía modula capacidad, recarga y consumo efectivo
 *   - Disparar consume capacitor; sin capacitor suficiente se corta la ráfaga
 *   - El capacitor regenera cuando la nave no dispara
 *   - Tras vaciarse, la nave espera una reserva mínima antes de reabrir fuego
 *
 * Habilidad del piloto (0–10, default 5):
 *   accEfectiva = clamp01(ship.accuracy + (pilotSkill - 5) × PILOT_SKILL_STEP)
 *   evaEfectiva = clamp01(ship.evasion  + (pilotSkill - 5) × PILOT_SKILL_STEP)
 *
 * Escudos:
 *   - Absorben todo el daño primero; el exceso va al casco
 *   - Tras recibir daño, entran en cooldown (shieldDamagedDelay segundos)
 *   - Si caen a 0, usan un cooldown más largo (shieldDownedDelay segundos)
 *   - Durante cooldown no regeneran
 *   - Fuera de cooldown regeneran shieldRegen HP/s
 *
 * Victoria (modo "timed"):
 *   - Si el casco de una nave llega a 0 antes del límite → misma regla que en "death"
 *   - Si no hay destrucción: al acabar el tiempo gana quien tenga más HP+shields
 *   - Si la diferencia es < 5% → empate técnico
 *
 * Victoria (modo "static"):
 *   - Sin maniobra, sin detección, sin jitter y sin fallos
 *   - Las naves permanecen a distancia fija
 *   - Puede disparar Alfa, Beta o ambos
 *   - Si una nave llega a 0 HP de casco pierde; si no, se resuelve al tiempo límite
 * ──────────────────────────────────────────────────────────────
 */

export const TICK_RATE      = 0.1   // segundos por tick
export const TICKS_PER_SEC  = Math.round(1 / TICK_RATE)
export const DRAW_THRESHOLD = 0.05  // diferencia mínima para no ser empate

/** ±0.20 a precisión/evasión en los extremos 0 y 10 */
export const PILOT_SKILL_STEP   = 0.04
/** Varianza de daño por tick (depende de la habilidad del piloto) */
export const DMG_VARIANCE_MIN = 0.04 // ±4% (piloto excelente)
export const DMG_VARIANCE_MAX = 0.18 // ±18% (piloto novato)
export const DMG_VARIANCE_POW = 1.6  // curva: mejora más notable en skills altas
export const DMG_VARIANCE_RANGE_ALPHA = 0.9 // >0: más lejos del rOpt = más varianza
export const DMG_VARIANCE_MERGE_MULT = 1.15 // multiplicador durante ventana de merge
export const DMG_VARIANCE_CAP = 0.28        // límite absoluto de varianza (±)

/** Modelo de distancia (range) simplificado */
export const RANGE_OPT_MIN_M = 600   // skill 10 → 600m
export const RANGE_OPT_MAX_M = 1000  // skill 0  → 1000m
export const FIRE_RANGE_MIN_M = 1000 // skill 10 → no suele abrir fuego por encima de 1km
export const FIRE_RANGE_MAX_M = 1400 // skill 0  → dispara antes, aunque con peor calidad
export const RANGE_INITIAL_M = 1500
export const RANGE_MIN_M     = 300
export const RANGE_CLOSING_MPS = 120
export const APPROACH_RANGE_M = 5000
export const APPROACH_SPEED_MIN_MPS = 250
export const APPROACH_SPEED_MAX_MPS = 850
export const APPROACH_BOOST_FACTOR = 0.45
export const RANGE_ACC_PENALTY_K = 0.9
export const RANGE_ACC_FLOOR = 0.10
export const MERGE_RANGE_M = 600
export const MERGE_WINDOW_SEC = 6
export const MERGE_SKILL_ADV_MAX = 0.10 // bonus/malus máx a hitChance durante el merge
export const ENGAGE_PULL_K = 0.9         // fuerza hacia rango objetivo tras el primer merge
export const ENGAGE_JITTER_MPS = 45      // variación (m/s) del rango (post-merge)
export const ENGAGE_CONTROL_MPS = 55     // control por diferencia de skill (m/s)

/** Modelo de tracking / time-on-target */
export const TRACKING_JITTER_MIN = 0.04   // piloto excelente: solucion mas estable
export const TRACKING_JITTER_MAX = 0.18   // piloto novato: solucion mas irregular
export const TRACKING_MERGE_PENALTY = 0.08
export const DEFENSIVE_SKILL_PRESSURE_MAX = 0.26
export const FIRE_CONTROL_MIN = 0.28      // skill 0: convierte poca ventana en fuego útil
export const FIRE_CONTROL_MAX = 0.90      // skill 10: capitaliza casi toda la ventana
export const OPPORTUNITY_EFFICIENCY_FLOOR = 0.18
export const EVASION_HIT_PENALTY_MIN = 0.48 // skill 10: lee mejor la evasión rival
export const EVASION_HIT_PENALTY_MAX = 0.78 // skill 0: sufre más la evasión rival
export const DUEL_SKILL_HIT_SWING = 0.22

/** Modelo de capacitor / ventanas de fuego */
export const WEAPON_CAP_MIN = 75
export const WEAPON_CAP_MAX = 190
export const WEAPON_CAP_REGEN_MIN = 12
export const WEAPON_CAP_REGEN_MAX = 36
export const WEAPON_CAP_DRAIN_MIN = 0
export const WEAPON_CAP_DRAIN_MAX = 62
export const WEAPON_CAP_RESUME_MIN = 0.18
export const WEAPON_CAP_RESUME_MAX = 0.34
export const WEAPON_CAP_SKILL_EFFICIENCY = 0.012

/** Modelo de daño por tipo, escudos y armor */
export const SHIELD_ENERGY_MULT = 1.00
export const SHIELD_PHYSICAL_MULT = 0.55
export const SHIELD_DISTORTION_MULT = 1.20
export const PHYSICAL_SHIELD_BLEED_MIN = 0.04
export const PHYSICAL_SHIELD_BLEED_MAX = 0.32
export const ARMOR_REDUCTION_MIN = 0.04
export const ARMOR_REDUCTION_MAX = 0.28
export const PENETRATION_DEPTH_REF_M = 6
export const PENETRATION_RADIUS_REF_M = 0.45
export const PENETRATION_ARMOR_BYPASS_MIN = 0.05
export const PENETRATION_ARMOR_BYPASS_MAX = 0.82
export const PENETRATION_RANGE_FALLOFF_START = 0.35
export const PENETRATION_RANGE_FALLOFF_MIN = 0.68

/** Modelo de detección (primer contacto / reacción) */
export const DETECTION_RANGE_DEFAULT_M = 20000
export const DETECTION_RANGE_MAX_M = 80000
export const DETECTION_SKILL_SCALE = 0.20 // ±20% al rango base según skill
export const REACTION_DELAY_MIN_SEC = 0.15
export const REACTION_DELAY_MAX_SEC = 1.25

/**
 * runSimulation(config) → SimulationResult
 *
 * @param {object} config
 * @param {object} config.shipA       — datos de nave (ver ships.js)
 * @param {object} config.shipB       — datos de nave
 * @param {'timed'|'static'|'death'} config.mode
 * @param {number} config.durationMin — minutos (modo timed)
 * @param {number} config.maxTimeMin  — minutos máximos (modo death)
 * @param {number} [config.pilotSkillA] — 0–10, habilidad piloto Alfa (default 5)
 * @param {number} [config.pilotSkillB] — 0–10, habilidad piloto Beta (default 5)
 * @param {number|string} [config.seed] — semilla RNG para reproducibilidad
 * @param {number} [config.initialRangeM] — distancia inicial en metros
 * @param {number} [config.closingSpeedMps] — velocidad de cierre (m/s)
 * @param {number} [config.minRangeM] — distancia mínima (m)
 * @param {number} [config.detectionRangeM] — rango base de detección (m)
 * @param {boolean} [config.staticFireA] — si Alfa dispara en modo estático
 * @param {boolean} [config.staticFireB] — si Beta dispara en modo estático
 *
 * @returns {SimulationResult}
 */
export function runSimulation({
  shipA, shipB, mode, durationMin, maxTimeMin,
  pilotSkillA = PILOT_SKILL_CENTER,
  pilotSkillB = PILOT_SKILL_CENTER,
  seed,
  initialRangeM = RANGE_INITIAL_M,
  closingSpeedMps = RANGE_CLOSING_MPS,
  minRangeM = RANGE_MIN_M,
  detectionRangeM = DETECTION_RANGE_DEFAULT_M,
  staticFireA = true,
  staticFireB = true,
}) {
  const isStatic = mode === 'static'
  const maxMins  = mode === 'death' ? maxTimeMin : durationMin
  const maxTicks = Math.round(maxMins * 60 / TICK_RATE)

  const seedUsed = normalizeSeed(seed)
  const rng = createRng(seedUsed)

  const rawSkillAUsed = isStatic ? PILOT_SKILL_CENTER : pilotSkillA
  const rawSkillBUsed = isStatic ? PILOT_SKILL_CENTER : pilotSkillB
  const skillAUsed = isStatic ? PILOT_SKILL_CENTER : adjustPilotSkillForShip(shipA, rawSkillAUsed)
  const skillBUsed = isStatic ? PILOT_SKILL_CENTER : adjustPilotSkillForShip(shipB, rawSkillBUsed)
  const accA = isStatic ? 1 : effectiveAccuracy(shipA, skillAUsed)
  const evaA = isStatic ? 0 : effectiveEvasion(shipA, skillAUsed)
  const accB = isStatic ? 1 : effectiveAccuracy(shipB, skillBUsed)
  const evaB = isStatic ? 0 : effectiveEvasion(shipB, skillBUsed)
  const vA = isStatic ? 0 : dmgVarianceForPilot(skillAUsed)
  const vB = isStatic ? 0 : dmgVarianceForPilot(skillBUsed)
  const rOptA = rangeOptForPilot(skillAUsed)
  const rOptB = rangeOptForPilot(skillBUsed)
  const fireRangeA = isStatic ? staticFireRangeM(shipA) : fireRangeForPilot(skillAUsed, rOptA)
  const fireRangeB = isStatic ? staticFireRangeM(shipB) : fireRangeForPilot(skillBUsed, rOptB)
  const weaponCapProfileA = weaponCapProfile(shipA, skillAUsed)
  const weaponCapProfileB = weaponCapProfile(shipB, skillBUsed)

  const initialRangeMUsed = Math.max(minRangeM, Number(initialRangeM) || RANGE_INITIAL_M)
  let rangeM = initialRangeMUsed
  let mergeAtSec = null
  let mergeCount = 0

  const detectionA = isStatic
    ? { rangeM: DETECTION_RANGE_MAX_M, radarStrength: 1, signatureScore: 1 }
    : detectionForPilot(shipA, shipB, detectionRangeM, rawSkillAUsed)
  const detectionB = isStatic
    ? { rangeM: DETECTION_RANGE_MAX_M, radarStrength: 1, signatureScore: 1 }
    : detectionForPilot(shipB, shipA, detectionRangeM, rawSkillBUsed)
  const detectA = detectionA.rangeM
  const detectB = detectionB.rangeM
  let detectedA = isStatic
  let detectedB = isStatic
  let readyAtA = isStatic ? 0 : Infinity
  let readyAtB = isStatic ? 0 : Infinity

  // Estado mutable de cada nave durante la simulación
  const stateA = {
    hull:        shipA.hullMax,
    vital:       vitalHullForShip(shipA),
    nonVital:    nonVitalHullForShip(shipA),
    pilotSkill:  skillAUsed,
    shield:      shipA.shieldMax,
    shieldTimer: 0,   // ticks restantes de cooldown
    weaponCap:   weaponCapProfileA.capacity,
    capHold:     false,
    weaponCharge: initialWeaponCharge(weaponCapProfileA),
    weaponAmmo:   initialWeaponAmmo(weaponCapProfileA),
  }
  const stateB = {
    hull:        shipB.hullMax,
    vital:       vitalHullForShip(shipB),
    nonVital:    nonVitalHullForShip(shipB),
    pilotSkill:  skillBUsed,
    shield:      shipB.shieldMax,
    shieldTimer: 0,
    weaponCap:   weaponCapProfileB.capacity,
    capHold:     false,
    weaponCharge: initialWeaponCharge(weaponCapProfileB),
    weaponAmmo:   initialWeaponAmmo(weaponCapProfileB),
  }

  // Acumuladores
  let totalDmgA = 0   // daño total infligido por A sobre B
  let totalDmgB = 0   // daño total infligido por B sobre A
  const totalDmgTypesA = {}
  const totalDmgTypesB = {}
  let totalShieldDmgA = 0, totalHullDmgA = 0
  let totalShieldDmgB = 0, totalHullDmgB = 0
  let totalVitalDmgA = 0, totalVitalDmgB = 0
  let ammoSpentA = 0, ammoSpentB = 0
  let ammoDryTicksA = 0, ammoDryTicksB = 0

  // Snapshots para gráficas (1 punto por segundo)
  const series = {
    labels:   [],
    aHull:    [], aShield: [],
    aVital:   [],
    bHull:    [], bShield: [],
    bVital:   [],
    aDmgCum:  [], bDmgCum: [],
    rangeM:   [],
  }

  // Eventos destacados del combate
  const events = []
  events.push({
    t: 0,
    text: `Distancia inicial: ${(initialRangeMUsed / 1000).toFixed(1)} km`,
    side: 'result',
  })
  if (isStatic) {
    events.push({
      t: 0,
      text: `Prueba estática: ${staticFireLabel(staticFireA, staticFireB)}`,
      side: 'result',
    })
  } else {
    events.push({
      t: 0,
      text: `Detección: Alfa ${(detectA / 1000).toFixed(1)} km · Beta ${(detectB / 1000).toFixed(1)} km`,
      side: 'result',
    })
  }

  // Detalle por segundo de disparos (para UI)
  const shots = []
  let secShotsA = 0, secHitsA = 0, secDmgA = 0
  let secShotsB = 0, secHitsB = 0, secDmgB = 0
  let totalShotsA = 0, totalHitsA = 0
  let totalShotsB = 0, totalHitsB = 0
  let fireTicksA = 0, fireTicksB = 0
  let opportunityTicksA = 0, opportunityTicksB = 0
  let capStarvedTicksA = 0, capStarvedTicksB = 0
  let capSumA = 0, capSumB = 0
  let capSamples = 0
  let shieldDownCountA = 0, shieldDownCountB = 0

  // Flags de eventos únicos
  const fired = {
    aShieldDown: false, bShieldDown: false,
    aHullHalf:   false, bHullHalf:   false,
    aVitalHalf:  false, bVitalHalf:  false,
    aFirstShots: false, bFirstShots: false,
  }

  let winner     = null
  let finishTick = maxTicks

  // ── LOOP PRINCIPAL ──────────────────────────────────────────
  for (let t = 0; t < maxTicks; t++) {
    const secNow = parseFloat((t * TICK_RATE).toFixed(2))

    // Detección / reacción
    if (!isStatic && !detectedA && rangeM <= detectA) {
      detectedA = true
      readyAtA = secNow + reactionDelaySec(rawSkillAUsed)
      events.push({ t: secNow, text: `${shipA.name} detecta al objetivo`, side: 'a' })
    }
    if (!isStatic && !detectedB && rangeM <= detectB) {
      detectedB = true
      readyAtB = secNow + reactionDelaySec(rawSkillBUsed)
      events.push({ t: secNow, text: `${shipB.name} detecta al objetivo`, side: 'b' })
    }

    const prevRangeM = rangeM
    // Range: antes del primer merge cierran; después oscila (puede abrirse y re-mergear)
    if (isStatic) {
      rangeM = initialRangeMUsed
    } else if (mergeCount === 0) {
      const closeMps = closingSpeedForRange(rangeM, shipA, shipB, closingSpeedMps)
      rangeM = Math.max(minRangeM, rangeM - closeMps * TICK_RATE)
    } else {
      const effA = clampPilotSkill(skillAUsed) * engageAwarenessFactor(detectedA, secNow >= readyAtA)
      const effB = clampPilotSkill(skillBUsed) * engageAwarenessFactor(detectedB, secNow >= readyAtB)
      const engageTargetM = engagementTargetRange(rOptA, rOptB, effA, effB, minRangeM, initialRangeMUsed)
      const controlGap = Math.abs(effA - effB) / 10
      const pull = (engageTargetM - rangeM) * ENGAGE_PULL_K
      const jitter = randUniform(rng, -ENGAGE_JITTER_MPS, ENGAGE_JITTER_MPS)
      const maxClosing = (Math.max(0, Number(closingSpeedMps) || RANGE_CLOSING_MPS)) + ENGAGE_CONTROL_MPS * controlGap
      const maxOpening = 200 + ENGAGE_CONTROL_MPS * controlGap
      const vel = clamp(pull + jitter, -maxClosing, maxOpening)
      rangeM = clamp(rangeM + vel * TICK_RATE, minRangeM, initialRangeMUsed)
    }

    // Merge: cada vez que cruzan hacia abajo el umbral (puede ocurrir varias veces)
    if (prevRangeM > MERGE_RANGE_M && rangeM <= MERGE_RANGE_M) {
      mergeAtSec = secNow
      mergeCount++
      events.push({ t: secNow, text: `Merge #${mergeCount} a ${MERGE_RANGE_M}m`, side: 'result' })
    }

    const inMergeWindow = !isStatic && mergeAtSec !== null && (secNow - mergeAtSec) <= MERGE_WINDOW_SEC
    const mergeBias = inMergeWindow ? mergeAdvantageBias(skillAUsed, skillBUsed) : 0

    // Disparos por tick (modelo hit/miss)
    const rangeFactorA = isStatic ? 1 : rangeAccuracyFactor(rangeM, rOptA)
    const rangeFactorB = isStatic ? 1 : rangeAccuracyFactor(rangeM, rOptB)

    const engagementWindowA = isStatic ? rangeM <= fireRangeA : detectedA && secNow >= readyAtA && rangeM <= fireRangeA
    const engagementWindowB = isStatic ? rangeM <= fireRangeB : detectedB && secNow >= readyAtB && rangeM <= fireRangeB
    const inFireEnvelopeA = isStatic ? engagementWindowA && Boolean(staticFireA) : engagementWindowA
    const inFireEnvelopeB = isStatic ? engagementWindowB && Boolean(staticFireB) : engagementWindowB
    const trackingA = isStatic ? 1 : (engagementWindowA ? trackingQuality(shipA, shipB, skillAUsed, skillBUsed, rangeFactorA, inMergeWindow, rng) : 0)
    const trackingB = isStatic ? 1 : (engagementWindowB ? trackingQuality(shipB, shipA, skillBUsed, skillAUsed, rangeFactorB, inMergeWindow, rng) : 0)
    const wantsFireA = inFireEnvelopeA
    const wantsFireB = inFireEnvelopeB
    const fireControlA = isStatic ? 1 : firingWindowFactor(trackingA, skillAUsed)
    const fireControlB = isStatic ? 1 : firingWindowFactor(trackingB, skillBUsed)

    const hitChanceA = isStatic
      ? (wantsFireA ? 1 : 0)
      : wantsFireA ? clamp01((accA * rangeFactorA) * evasionHitFactor(evaB, skillAUsed) * duelSkillHitFactor(skillAUsed, skillBUsed) * trackingHitFactor(trackingA) + mergeBias) : 0
    const hitChanceB = isStatic
      ? (wantsFireB ? 1 : 0)
      : wantsFireB ? clamp01((accB * rangeFactorB) * evasionHitFactor(evaA, skillBUsed) * duelSkillHitFactor(skillBUsed, skillAUsed) * trackingHitFactor(trackingB) - mergeBias) : 0
    const effectiveHitChanceA = isStatic ? hitChanceA : hitChanceA * averageWeaponTrackingFactor(weaponCapProfileA, shipB, skillBUsed, skillAUsed)
    const effectiveHitChanceB = isStatic ? hitChanceB : hitChanceB * averageWeaponTrackingFactor(weaponCapProfileB, shipA, skillAUsed, skillBUsed)
    const opportunityEfficiencyA = fireControlA * effectiveHitChanceA
    const opportunityEfficiencyB = fireControlB * effectiveHitChanceB
    const opportunityA = isStatic
      ? inFireEnvelopeA
      : engagementWindowA && opportunityEfficiencyA >= OPPORTUNITY_EFFICIENCY_FLOOR
    const opportunityB = isStatic
      ? inFireEnvelopeB
      : engagementWindowB && opportunityEfficiencyB >= OPPORTUNITY_EFFICIENCY_FLOOR

    const varA = isStatic ? 0 : varianceForShot(vA, rangeM, rOptA, inMergeWindow)
    const varB = isStatic ? 0 : varianceForShot(vB, rangeM, rOptB, inMergeWindow)
    const fireA = resolveWeaponFire(stateA, weaponCapProfileA, wantsFireA, fireControlA, hitChanceA, varA, rng, skillAUsed, shipB, skillBUsed, rangeM)
    const fireB = resolveWeaponFire(stateB, weaponCapProfileB, wantsFireB, fireControlB, hitChanceB, varB, rng, skillBUsed, shipA, skillAUsed, rangeM)
    if (fireA.capStarved) capStarvedTicksA++
    if (fireB.capStarved) capStarvedTicksB++
    if (fireA.ammoDry) ammoDryTicksA++
    if (fireB.ammoDry) ammoDryTicksB++

    if (fireA.shots > 0 && !fired.aFirstShots) {
      fired.aFirstShots = true
      events.push({ t: secNow, text: `${shipA.name} abre fuego (${Math.round(rangeM)}m · óptimo ~${Math.round(rOptA)}m)`, side: 'a' })
    }
    if (fireB.shots > 0 && !fired.bFirstShots) {
      fired.bFirstShots = true
      events.push({ t: secNow, text: `${shipB.name} abre fuego (${Math.round(rangeM)}m · óptimo ~${Math.round(rOptB)}m)`, side: 'b' })
    }

    if (fireA.shots > 0) { secShotsA += fireA.shots; totalShotsA += fireA.shots; fireTicksA++ }
    if (fireB.shots > 0) { secShotsB += fireB.shots; totalShotsB += fireB.shots; fireTicksB++ }
    if (opportunityA) opportunityTicksA++
    if (opportunityB) opportunityTicksB++

    const shieldBeforeImpactB = stateB.shield
    const shieldBeforeImpactA = stateA.shield
    const appliedA = applyDamage(stateB, fireA.impacts, shipB)
    const appliedB = applyDamage(stateA, fireB.impacts, shipA)
    const dmgAonB = appliedA.total
    const dmgBonA = appliedB.total

    secHitsA += fireA.hits
    totalHitsA += fireA.hits
    secDmgA += dmgAonB
    addDamageBuckets(totalDmgTypesA, appliedA.byType)
    totalShieldDmgA += appliedA.shieldDamage
    totalHullDmgA += appliedA.hullDamage
    totalVitalDmgA += appliedA.vitalDamage
    ammoSpentA += fireA.ammoSpent

    secHitsB += fireB.hits
    totalHitsB += fireB.hits
    secDmgB += dmgBonA
    addDamageBuckets(totalDmgTypesB, appliedB.byType)
    totalShieldDmgB += appliedB.shieldDamage
    totalHullDmgB += appliedB.hullDamage
    totalVitalDmgB += appliedB.vitalDamage
    ammoSpentB += fireB.ammoSpent

    // Regeneración de escudos
    regenShield(stateA, shipA)
    regenShield(stateB, shipB)

    totalDmgA += dmgAonB
    totalDmgB += dmgBonA
    capSumA += stateA.weaponCap / weaponCapProfileA.capacity
    capSumB += stateB.weaponCap / weaponCapProfileB.capacity
    capSamples++

    // Detección de eventos
    if (appliedB.shieldDamage > 0 && stateA.shield <= 0 && shieldBeforeImpactA > 0) {
      shieldDownCountA++
    }
    if (appliedA.shieldDamage > 0 && stateB.shield <= 0 && shieldBeforeImpactB > 0) {
      shieldDownCountB++
    }

    if (!fired.bShieldDown && stateB.shield <= 0) {
      fired.bShieldDown = true
      events.push({ t: secNow, text: `Escudo de ${shipB.name} destruido`, side: 'b' })
    }
    if (!fired.aShieldDown && stateA.shield <= 0) {
      fired.aShieldDown = true
      events.push({ t: secNow, text: `Escudo de ${shipA.name} destruido`, side: 'a' })
    }
    if (!fired.bHullHalf && stateB.hull <= shipB.hullMax * 0.5) {
      fired.bHullHalf = true
      events.push({ t: secNow, text: `${shipB.name} bajo 50% de casco`, side: 'b' })
    }
    if (!fired.aHullHalf && stateA.hull <= shipA.hullMax * 0.5) {
      fired.aHullHalf = true
      events.push({ t: secNow, text: `${shipA.name} bajo 50% de casco`, side: 'a' })
    }
    if (!fired.bVitalHalf && stateB.vital <= vitalHullForShip(shipB) * 0.5) {
      fired.bVitalHalf = true
      events.push({ t: secNow, text: `Componente vital de ${shipB.name} comprometido`, side: 'b' })
    }
    if (!fired.aVitalHalf && stateA.vital <= vitalHullForShip(shipA) * 0.5) {
      fired.aVitalHalf = true
      events.push({ t: secNow, text: `Componente vital de ${shipA.name} comprometido`, side: 'a' })
    }

    // Snapshot por segundo
    if (t % TICKS_PER_SEC === 0) {
      series.labels.push(Math.round(secNow))
      series.aHull.push(Math.round(stateA.hull))
      series.aShield.push(Math.round(stateA.shield))
      series.aVital.push(Math.round(stateA.vital))
      series.bHull.push(Math.round(stateB.hull))
      series.bShield.push(Math.round(stateB.shield))
      series.bVital.push(Math.round(stateB.vital))
      series.aDmgCum.push(Math.round(totalDmgA))
      series.bDmgCum.push(Math.round(totalDmgB))
      series.rangeM.push(Math.round(rangeM))

      shots.push({
        t: Math.round(secNow),
        rangeM: Math.round(rangeM),
        a: { shots: secShotsA, hits: secHitsA, dmg: Math.round(secDmgA) },
        b: { shots: secShotsB, hits: secHitsB, dmg: Math.round(secDmgB) },
      })
      secShotsA = 0; secHitsA = 0; secDmgA = 0
      secShotsB = 0; secHitsB = 0; secDmgB = 0
    }

    // Casco a 0: fin del combate en cualquier modo (timed incluido)
    const aDead = stateA.vital <= 0
    const bDead = stateB.vital <= 0
    if (aDead || bDead) {
      winner     = aDead && bDead ? 'draw' : aDead ? 'b' : 'a'
      finishTick = t
      const txt  = winner === 'draw'
        ? 'Ambas naves destruidas simultáneamente'
        : `¡${winner === 'a' ? shipB.name : shipA.name} destruido!`
      events.push({ t: secNow, text: txt, side: 'result' })
      break
    }
  }

  // Resolución en modo "duración fija" (o "death" sin ganador)
  if (!winner) {
    const totalA = stateA.hull + stateA.shield
    const totalB = stateB.hull + stateB.shield
    const diff   = Math.abs(totalA - totalB) / Math.max(totalA, totalB)
    winner       = diff < DRAW_THRESHOLD ? 'draw' : totalA > totalB ? 'a' : 'b'
    const txt    = winner === 'draw'
      ? 'Tiempo agotado — empate técnico'
      : `Tiempo agotado — ${winner === 'a' ? shipA.name : shipB.name} con ventaja`
    events.push({ t: maxMins * 60, text: txt, side: 'result' })
  }

  const durationSec = parseFloat((finishTick * TICK_RATE).toFixed(1))
  appendFinalSeriesPoint(series, durationSec, stateA, stateB, totalDmgA, totalDmgB, rangeM)
  const effDpsA     = durationSec > 0 ? totalDmgA / durationSec : 0
  const effDpsB     = durationSec > 0 ? totalDmgB / durationSec : 0
  const avgCapPctA  = capSamples > 0 ? Math.round((capSumA / capSamples) * 100) : 100
  const avgCapPctB  = capSamples > 0 ? Math.round((capSumB / capSamples) * 100) : 100
  const ammoCapacityA = ammoCapacityForProfile(weaponCapProfileA)
  const ammoCapacityB = ammoCapacityForProfile(weaponCapProfileB)
  const ammoRemainingA = ammoRemainingForState(stateA, weaponCapProfileA)
  const ammoRemainingB = ammoRemainingForState(stateB, weaponCapProfileB)

  return {
    mode,
    winner,                           // 'a' | 'b' | 'draw'
    durationSec,
    seedUsed,
    initialRangeMUsed,
    mergeAtSec,
    mergeCount,
    staticFire: {
      a: Boolean(staticFireA),
      b: Boolean(staticFireB),
    },
    detection: {
      a: {
        rangeM: detectA,
        readyAtSec: Number.isFinite(readyAtA) ? parseFloat(readyAtA.toFixed(2)) : null,
        radarStrength: detectionA.radarStrength,
        targetSignature: detectionA.signatureScore,
      },
      b: {
        rangeM: detectB,
        readyAtSec: Number.isFinite(readyAtB) ? parseFloat(readyAtB.toFixed(2)) : null,
        radarStrength: detectionB.radarStrength,
        targetSignature: detectionB.signatureScore,
      },
    },
    events,
    shots,
    series,
    stats: {
      a: {
        hullRemaining:   Math.round(stateA.hull),
        vitalRemaining:  Math.round(stateA.vital),
        shieldRemaining: Math.round(stateA.shield),
        hullPct:         pctRemaining(stateA.hull, shipA.hullMax),
        vitalPct:        pctRemaining(stateA.vital, vitalHullForShip(shipA)),
        shieldPct:       pctRemaining(stateA.shield, shipA.shieldMax),
        totalHpPct:      pctRemaining(stateA.hull + stateA.shield, shipA.hullMax + shipA.shieldMax),
        totalDmgDealt:   Math.round(totalDmgA),
        effectiveDps:    parseFloat(effDpsA.toFixed(1)),
        theoreticalDps:  theoreticalSimDpsForProfile(weaponCapProfileA, shipA.dps),
        rawWeaponDps:    Math.round(Number(shipA.weaponBank?.totalBurstDps) || shipA.dps || 0),
        legacyDps:       Math.round(Number(shipA.legacyDps) || shipA.dps || 0),
        dpsSource:       shipA.dpsSource ?? shipA.weaponBank?.dataSource ?? 'mock',
        damageByType:    roundedDamageBuckets(totalDmgTypesA),
        shieldDmgDealt:  Math.round(totalShieldDmgA),
        hullDmgDealt:    Math.round(totalHullDmgA),
        vitalDmgDealt:   Math.round(totalVitalDmgA),
        hullArmorPct:    Math.round(armorReductionForShip(shipA) * 100),
        weaponGroups:    weaponCapProfileA.weaponGroups,
        shotsFired:      totalShotsA,
        hits:            totalHitsA,
        hitPct:          totalShotsA > 0 ? Math.round((totalHitsA / totalShotsA) * 100) : 0,
        avgDamagePerShot: totalShotsA > 0 ? parseFloat((totalDmgA / totalShotsA).toFixed(1)) : 0,
        avgDamagePerHit:  totalHitsA > 0 ? parseFloat((totalDmgA / totalHitsA).toFixed(1)) : 0,
        shieldDowns:     shieldDownCountA,
        fireTimeSec:     parseFloat((fireTicksA * TICK_RATE).toFixed(1)),
        fireUptimePct:   durationSec > 0 ? Math.round(((fireTicksA * TICK_RATE) / durationSec) * 100) : 0,
        opportunityTimeSec: parseFloat((opportunityTicksA * TICK_RATE).toFixed(1)),
        opportunityUptimePct: durationSec > 0 ? Math.round(((opportunityTicksA * TICK_RATE) / durationSec) * 100) : 0,
        weaponCapPct:    Math.round((stateA.weaponCap / weaponCapProfileA.capacity) * 100),
        avgWeaponCapPct: avgCapPctA,
        capStarvedPct:   durationSec > 0 ? Math.round(((capStarvedTicksA * TICK_RATE) / durationSec) * 100) : 0,
        weaponCapCapacity: Math.round(weaponCapProfileA.capacity),
        weaponCapRegen:  parseFloat(weaponCapProfileA.regenPerSec.toFixed(1)),
        weaponCapDrain:  parseFloat(weaponCapProfileA.drainPerSec.toFixed(1)),
        weaponCount:     weaponCapProfileA.weaponCount,
        ballisticWeaponCount: weaponCapProfileA.ballisticWeaponCount,
        powerPlantOutput: weaponCapProfileA.powerPlantOutput,
        powerPlantEnergyRatio: weaponCapProfileA.powerPlantEnergyRatio,
        powerPlantRegenMult: weaponCapProfileA.powerPlantRegenMult,
        weaponDataSource: weaponCapProfileA.dataSource,
        ammoCapacity:    ammoCapacityA,
        ammoRemaining:   ammoRemainingA,
        ammoSpent:       ammoSpentA,
        ammoRemainingPct: ammoCapacityA > 0 ? Math.round((ammoRemainingA / ammoCapacityA) * 100) : null,
        ammoDryPct:      durationSec > 0 ? Math.round(((ammoDryTicksA * TICK_RATE) / durationSec) * 100) : 0,
      },
      b: {
        hullRemaining:   Math.round(stateB.hull),
        vitalRemaining:  Math.round(stateB.vital),
        shieldRemaining: Math.round(stateB.shield),
        hullPct:         pctRemaining(stateB.hull, shipB.hullMax),
        vitalPct:        pctRemaining(stateB.vital, vitalHullForShip(shipB)),
        shieldPct:       pctRemaining(stateB.shield, shipB.shieldMax),
        totalHpPct:      pctRemaining(stateB.hull + stateB.shield, shipB.hullMax + shipB.shieldMax),
        totalDmgDealt:   Math.round(totalDmgB),
        effectiveDps:    parseFloat(effDpsB.toFixed(1)),
        theoreticalDps:  theoreticalSimDpsForProfile(weaponCapProfileB, shipB.dps),
        rawWeaponDps:    Math.round(Number(shipB.weaponBank?.totalBurstDps) || shipB.dps || 0),
        legacyDps:       Math.round(Number(shipB.legacyDps) || shipB.dps || 0),
        dpsSource:       shipB.dpsSource ?? shipB.weaponBank?.dataSource ?? 'mock',
        damageByType:    roundedDamageBuckets(totalDmgTypesB),
        shieldDmgDealt:  Math.round(totalShieldDmgB),
        hullDmgDealt:    Math.round(totalHullDmgB),
        vitalDmgDealt:   Math.round(totalVitalDmgB),
        hullArmorPct:    Math.round(armorReductionForShip(shipB) * 100),
        weaponGroups:    weaponCapProfileB.weaponGroups,
        shotsFired:      totalShotsB,
        hits:            totalHitsB,
        hitPct:          totalShotsB > 0 ? Math.round((totalHitsB / totalShotsB) * 100) : 0,
        avgDamagePerShot: totalShotsB > 0 ? parseFloat((totalDmgB / totalShotsB).toFixed(1)) : 0,
        avgDamagePerHit:  totalHitsB > 0 ? parseFloat((totalDmgB / totalHitsB).toFixed(1)) : 0,
        shieldDowns:     shieldDownCountB,
        fireTimeSec:     parseFloat((fireTicksB * TICK_RATE).toFixed(1)),
        fireUptimePct:   durationSec > 0 ? Math.round(((fireTicksB * TICK_RATE) / durationSec) * 100) : 0,
        opportunityTimeSec: parseFloat((opportunityTicksB * TICK_RATE).toFixed(1)),
        opportunityUptimePct: durationSec > 0 ? Math.round(((opportunityTicksB * TICK_RATE) / durationSec) * 100) : 0,
        weaponCapPct:    Math.round((stateB.weaponCap / weaponCapProfileB.capacity) * 100),
        avgWeaponCapPct: avgCapPctB,
        capStarvedPct:   durationSec > 0 ? Math.round(((capStarvedTicksB * TICK_RATE) / durationSec) * 100) : 0,
        weaponCapCapacity: Math.round(weaponCapProfileB.capacity),
        weaponCapRegen:  parseFloat(weaponCapProfileB.regenPerSec.toFixed(1)),
        weaponCapDrain:  parseFloat(weaponCapProfileB.drainPerSec.toFixed(1)),
        weaponCount:     weaponCapProfileB.weaponCount,
        ballisticWeaponCount: weaponCapProfileB.ballisticWeaponCount,
        powerPlantOutput: weaponCapProfileB.powerPlantOutput,
        powerPlantEnergyRatio: weaponCapProfileB.powerPlantEnergyRatio,
        powerPlantRegenMult: weaponCapProfileB.powerPlantRegenMult,
        weaponDataSource: weaponCapProfileB.dataSource,
        ammoCapacity:    ammoCapacityB,
        ammoRemaining:   ammoRemainingB,
        ammoSpent:       ammoSpentB,
        ammoRemainingPct: ammoCapacityB > 0 ? Math.round((ammoRemainingB / ammoCapacityB) * 100) : null,
        ammoDryPct:      durationSec > 0 ? Math.round(((ammoDryTicksB * TICK_RATE) / durationSec) * 100) : 0,
      },
    },
  }
}

// ── HELPERS INTERNOS ────────────────────────────────────────────

function normalizeSeed(seed) {
  if (seed === undefined || seed === null || seed === '') return Date.now()
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed
  const s = String(seed)
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function createRng(seed) {
  // mulberry32
  let a = (seed >>> 0) || 1
  return function rand() {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randUniform(rand, min, max) {
  return min + (max - min) * rand()
}

function dmgVarianceForPilot(pilotSkill) {
  const s = clampPilotSkill(pilotSkill) / 10
  const t = Math.pow(1 - s, DMG_VARIANCE_POW)
  return DMG_VARIANCE_MIN + (DMG_VARIANCE_MAX - DMG_VARIANCE_MIN) * t
}

function varianceForShot(baseVariance, rangeM, rOptM, inMergeWindow) {
  const overRatio = Math.max(0, rangeM - rOptM) / Math.max(1, rOptM)
  let v = baseVariance * (1 + DMG_VARIANCE_RANGE_ALPHA * overRatio)
  if (inMergeWindow) v *= DMG_VARIANCE_MERGE_MULT
  return Math.min(DMG_VARIANCE_CAP, Math.max(0, v))
}

function applyVariance(base, variance, rand) {
  if (base <= 0) return 0
  const m = 1 + randUniform(rand, -variance, variance)
  return Math.max(0, base * m)
}

function rangeOptForPilot(pilotSkill) {
  const s = clampPilotSkill(pilotSkill) / 10
  return RANGE_OPT_MIN_M + (RANGE_OPT_MAX_M - RANGE_OPT_MIN_M) * (1 - s)
}

function fireRangeForPilot(pilotSkill, rOptM) {
  const s = clampPilotSkill(pilotSkill) / 10
  const fireRange = FIRE_RANGE_MIN_M + (FIRE_RANGE_MAX_M - FIRE_RANGE_MIN_M) * (1 - s)
  return Math.max(rOptM, fireRange)
}

function engagementTargetRange(rOptA, rOptB, controlA, controlB, minRangeM, maxRangeM) {
  const wA = 1 + Math.max(0, Number(controlA) || 0)
  const wB = 1 + Math.max(0, Number(controlB) || 0)
  const target = (rOptA * wA + rOptB * wB) / (wA + wB)
  return clamp(target, minRangeM, maxRangeM)
}

function closingSpeedForRange(rangeM, shipA, shipB, fallbackMps) {
  const combatCloseMps = Math.max(0, Number(fallbackMps) || RANGE_CLOSING_MPS)
  if (rangeM <= APPROACH_RANGE_M) return combatCloseMps

  const boostA = Number(shipA?.speedBoost) || (Number(shipA?.speedSCM) || 0) * 4 || combatCloseMps
  const boostB = Number(shipB?.speedBoost) || (Number(shipB?.speedSCM) || 0) * 4 || combatCloseMps
  const approachMps = ((boostA + boostB) / 2) * APPROACH_BOOST_FACTOR
  return clamp(approachMps, Math.max(combatCloseMps, APPROACH_SPEED_MIN_MPS), APPROACH_SPEED_MAX_MPS)
}

function trackingQuality(attackerShip, defenderShip, pilotSkill, defenderPilotSkill, rangeFactor, inMergeWindow, rand) {
  const s = clampPilotSkill(pilotSkill) / 10
  const attackerControl = trackingControlScore(attackerShip)
  const defenderPressure = defensiveManeuverPressure(defenderShip, defenderPilotSkill)
  const jitter = randUniform(rand, -trackingJitterForPilot(pilotSkill), trackingJitterForPilot(pilotSkill))
  const mergePenalty = inMergeWindow
    ? TRACKING_MERGE_PENALTY * (1 - s) * mergeManeuverMultiplier(attackerShip, defenderShip)
    : 0
  return clamp01(0.16 + s * 0.34 + attackerControl * 0.29 + rangeFactor * 0.29 - defenderPressure - mergePenalty + jitter)
}

function trackingControlScore(ship) {
  const accuracy = Number(ship?.accuracy) || 0.6
  const evasion = Number(ship?.evasion) || 0.25
  const strafe = normalizedShipField(ship, 'strafeThrusterScore', evasion)
  const boost = normalizedShipField(ship, 'boostThrusterScore', evasion)
  const thrusters = normalizedShipField(ship, 'thrusterScore', evasion)
  return clamp01(0.34 + accuracy * 0.28 + evasion * 0.12 + strafe * 0.12 + boost * 0.06 + thrusters * 0.08)
}

function defensiveManeuverPressure(ship, pilotSkill = PILOT_SKILL_CENTER) {
  const evasion = Number(ship?.evasion) || 0.25
  const strafe = normalizedShipField(ship, 'strafeThrusterScore', evasion)
  const boost = normalizedShipField(ship, 'boostThrusterScore', evasion)
  const thrusters = normalizedShipField(ship, 'thrusterScore', evasion)
  const skill = clampPilotSkill(pilotSkill) / 10
  return clamp01(0.10 + evasion * 0.40 + strafe * 0.18 + boost * 0.08 + thrusters * 0.08 + skill * DEFENSIVE_SKILL_PRESSURE_MAX)
}

function mergeManeuverMultiplier(attackerShip, defenderShip) {
  const attackerBoost = normalizedShipField(attackerShip, 'boostThrusterScore', attackerShip?.evasion ?? 0.25)
  const defenderBoost = normalizedShipField(defenderShip, 'boostThrusterScore', defenderShip?.evasion ?? 0.25)
  const defenderStrafe = normalizedShipField(defenderShip, 'strafeThrusterScore', defenderShip?.evasion ?? 0.25)
  return clamp(1 + defenderBoost * 0.22 + defenderStrafe * 0.18 - attackerBoost * 0.18, 0.82, 1.35)
}

function normalizedShipField(ship, field, fallback = 0.25) {
  const value = Number(ship?.[field])
  if (Number.isFinite(value)) return clamp01(value)
  return clamp01(Number(fallback) || 0)
}

function trackingJitterForPilot(pilotSkill) {
  const s = clampPilotSkill(pilotSkill) / 10
  return TRACKING_JITTER_MIN + (TRACKING_JITTER_MAX - TRACKING_JITTER_MIN) * (1 - s)
}

function trackingHitFactor(tracking) {
  return clamp(0.70 + tracking * 0.55, 0.70, 1.25)
}

function firingWindowFactor(tracking, pilotSkill) {
  const s = clampPilotSkill(pilotSkill) / 10
  const skillBase = FIRE_CONTROL_MIN + (FIRE_CONTROL_MAX - FIRE_CONTROL_MIN) * s
  return clamp(0.18 + skillBase * 0.46 + clamp01(tracking) * 0.52, 0.18, 0.96)
}

function evasionHitFactor(defenderEvasion, attackerSkill) {
  const evasion = clamp01(Number(defenderEvasion) || 0)
  const s = clampPilotSkill(attackerSkill) / 10
  const penalty = EVASION_HIT_PENALTY_MAX + (EVASION_HIT_PENALTY_MIN - EVASION_HIT_PENALTY_MAX) * s
  return clamp(1 - evasion * penalty, 0.35, 1)
}

function duelSkillHitFactor(attackerSkill, defenderSkill) {
  const diff = clamp(clampPilotSkill(attackerSkill) - clampPilotSkill(defenderSkill), -10, 10)
  return clamp(1 + (diff / 10) * DUEL_SKILL_HIT_SWING, 0.82, 1.18)
}

function targetAgilityScore(ship) {
  const evasion = Number(ship?.evasion) || 0.25
  const strafe = normalizedShipField(ship, 'strafeThrusterScore', evasion)
  const boost = normalizedShipField(ship, 'boostThrusterScore', evasion)
  const thrusters = normalizedShipField(ship, 'thrusterScore', evasion)
  return clamp01(evasion * 0.45 + strafe * 0.25 + boost * 0.15 + thrusters * 0.15)
}

function weaponTrackingVsTargetFactor(group, defenderShip, defenderSkill = PILOT_SKILL_CENTER, attackerSkill = PILOT_SKILL_CENTER) {
  if (!defenderShip) return 1

  const projectileSpeed = Math.max(0, Number(group?.projectileSpeed) || 0)
  const rpm = Math.max(0, Number(group?.rpm) || 0)
  const spread = Math.max(0, Number(group?.spreadMax) || 0)
  const attackerAim = clampPilotSkill(attackerSkill) / 10

  const projectileScore = clamp01((projectileSpeed - 800) / 1200)
  const cadenceScore = clamp01((rpm - 80) / 900)
  const spreadScore = clamp01(1 - spread / 1.2)
  const weaponTracking = clamp01(projectileScore * 0.45 + cadenceScore * 0.35 + spreadScore * 0.20)

  const defenderAgility = targetAgilityScore(defenderShip)
  const defenderStability = 1 - defenderAgility
  const skill = clampPilotSkill(defenderSkill) / 10

  const penalty = defenderAgility * (
    0.18 +
    (1 - weaponTracking) * 0.42 +
    skill * (0.16 + (1 - weaponTracking) * 0.22)
  )

  const attackerBonus = attackerAim * (
    0.04 +
    defenderStability * 0.12 +
    weaponTracking * 0.08
  )

  return clamp(0.5 + weaponTracking * 0.5 + attackerBonus - penalty, 0.35, 1.14)
}

function averageWeaponTrackingFactor(profile, defenderShip, defenderSkill = PILOT_SKILL_CENTER, attackerSkill = PILOT_SKILL_CENTER) {
  const groups = weaponGroupsForProfile(profile)
  if (groups.length === 0) return 1

  let weightedSum = 0
  let totalWeight = 0

  groups.forEach((group) => {
    const weight = Math.max(1, Number(group?.simBurstDps) || 0)
    weightedSum += weaponTrackingVsTargetFactor(group, defenderShip, defenderSkill, attackerSkill) * weight
    totalWeight += weight
  })

  return totalWeight > 0 ? weightedSum / totalWeight : 1
}

function initialWeaponCharge(profile) {
  return weaponGroupsForProfile(profile).map(group => weaponFireInterval(group))
}

function initialWeaponAmmo(profile) {
  return weaponGroupsForProfile(profile).map(group => {
    const ammo = Number(group.ammoCapacity)
    return Number.isFinite(ammo) && ammo > 0 ? ammo : Infinity
  })
}

function resolveWeaponFire(state, profile, wantsFire, fireControl, hitChance, variance, rand, attackerSkill = PILOT_SKILL_CENTER, defenderShip = null, defenderSkill = PILOT_SKILL_CENTER, rangeM = 0) {
  const groups = weaponGroupsForProfile(profile)
  ensureWeaponChargeSlots(state, groups)
  ensureWeaponAmmoSlots(state, groups)

  if (state.capHold && state.weaponCap >= profile.resumeAt) {
    state.capHold = false
  }

  let capStarved = false
  if (!wantsFire) {
    readyWeaponGroups(state, groups)
    regenerateWeaponCap(state, profile)
    return emptyFireResult(false)
  }

  const result = emptyFireResult(false)
  let energyShotFired = false

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    const groupRangeM = Number(group?.rangeM)
    if (Number.isFinite(groupRangeM) && groupRangeM > 0 && rangeM > groupRangeM) {
      continue
    }
    const interval = weaponFireInterval(group)
    state.weaponCharge[i] = Math.min(interval + TICK_RATE, state.weaponCharge[i] + TICK_RATE)

    let safety = 0
    while (state.weaponCharge[i] >= interval && safety < 20) {
      let volleyFired = false
      let blockedByCapacitor = false
      const projectiles = Math.max(1, Math.round(Number(group.count) || 1))

      if (fireControl < 1 && rand() > fireControl) {
        state.weaponCharge[i] -= interval
        safety++
        continue
      }

      for (let p = 0; p < projectiles; p++) {
        if (state.weaponAmmo[i] <= 0) {
          result.ammoDry = true
          break
        }

        const capCost = weaponCapCost(group, profile)
        if (capCost > 0 && state.capHold) {
          capStarved = true
          blockedByCapacitor = true
          break
        }

        if (state.weaponCap < capCost) {
          state.capHold = true
          capStarved = true
          blockedByCapacitor = true
          break
        }

        state.weaponCap = Math.max(0, state.weaponCap - capCost)
        if (capCost > 0) {
          energyShotFired = true
          if (state.weaponCap < capCost) state.capHold = true
        }
        if (Number.isFinite(state.weaponAmmo[i])) {
          state.weaponAmmo[i] = Math.max(0, state.weaponAmmo[i] - 1)
          result.ammoSpent++
        }
        result.shots++
        volleyFired = true

        const groupHitChance = hitChance * weaponTrackingVsTargetFactor(group, defenderShip, defenderSkill, attackerSkill)
        if (rand() < groupHitChance) {
          const dmg = applyVariance(Number(group.simAlpha) || 0, variance, rand)
          result.hits++
          result.rawDamage += dmg
          result.impacts.push({
            damage: dmg,
            profile: group.damageProfile,
            penetration: group.penetration,
            impactRangeM: rangeM,
            weaponRangeM: group.rangeM,
            attackerSkill,
            type: group.type,
          })
        }
      }

      if (!volleyFired) {
        if (blockedByCapacitor) {
          state.weaponCharge[i] = Math.min(state.weaponCharge[i], interval)
        }
        break
      }
      state.weaponCharge[i] -= interval
      safety++
    }
  }

  if (!energyShotFired) {
    regenerateWeaponCap(state, profile)
  }

  return { ...result, capStarved }
}

function emptyFireResult(capStarved = false) {
  return { shots: 0, hits: 0, rawDamage: 0, impacts: [], ammoSpent: 0, ammoDry: false, capStarved }
}

function ensureWeaponChargeSlots(state, groups) {
  if (!Array.isArray(state.weaponCharge)) state.weaponCharge = []
  while (state.weaponCharge.length < groups.length) {
    state.weaponCharge.push(weaponFireInterval(groups[state.weaponCharge.length]))
  }
}

function ensureWeaponAmmoSlots(state, groups) {
  if (!Array.isArray(state.weaponAmmo)) state.weaponAmmo = []
  while (state.weaponAmmo.length < groups.length) {
    const ammo = Number(groups[state.weaponAmmo.length]?.ammoCapacity)
    state.weaponAmmo.push(Number.isFinite(ammo) && ammo > 0 ? ammo : Infinity)
  }
}

function readyWeaponGroups(state, groups) {
  groups.forEach((group, i) => {
    const interval = weaponFireInterval(group)
    state.weaponCharge[i] = Math.min(interval, (state.weaponCharge[i] ?? interval) + TICK_RATE)
  })
}

function regenerateWeaponCap(state, profile) {
  state.weaponCap = Math.min(profile.capacity, state.weaponCap + profile.regenPerSec * TICK_RATE)
  if (state.weaponCap >= profile.resumeAt) {
    state.capHold = false
  }
}

function weaponGroupsForProfile(profile) {
  if (Array.isArray(profile.weaponGroups) && profile.weaponGroups.length > 0) return profile.weaponGroups
  return [{
    id: 'fallback_weapon',
    name: 'Armas',
    count: 1,
    rpm: 600,
    fireIntervalSec: TICK_RATE,
    simAlpha: (Number(profile.fallbackDps) || 0) * TICK_RATE,
    capCostPerShot: Math.max(0.1, profile.drainPerSec * TICK_RATE),
    damageProfile: { energy: 1 },
  }]
}

function weaponFireInterval(group) {
  const explicit = Number(group?.fireIntervalSec)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  const rpm = Number(group?.rpm) || 600
  return Math.max(0.02, 60 / Math.max(1, rpm))
}

function weaponCapCost(group, profile) {
  const cost = Number(group?.capCostPerShot)
  const mult = profile.capCostMult ?? 1
  if (Number.isFinite(cost) && cost >= 0) return Math.max(0, cost * mult)
  const base = profile.drainPerSec * weaponFireInterval(group)
  return Math.max(0.05, base * mult)
}

function addDamageByProfile(target, damage, profile) {
  const entries = Object.entries(profile && Object.keys(profile).length > 0 ? profile : { energy: 1 })
  entries.forEach(([type, fraction]) => {
    const f = Number(fraction) || 0
    target[type] = (target[type] ?? 0) + damage * f
  })
}

function addDamageBuckets(target, source) {
  Object.entries(source ?? {}).forEach(([type, damage]) => {
    target[type] = (target[type] ?? 0) + (Number(damage) || 0)
  })
}

function roundedDamageBuckets(source) {
  return Object.fromEntries(Object.entries(source ?? {})
    .filter(([, damage]) => damage > 0)
    .map(([type, damage]) => [type, Math.round(damage)]))
}

function appendFinalSeriesPoint(series, durationSec, stateA, stateB, totalDmgA, totalDmgB, rangeM) {
  const lastLabel = series.labels[series.labels.length - 1]
  if (Number.isFinite(lastLabel) && Math.abs(lastLabel - durationSec) < 0.001) return

  series.labels.push(durationSec)
  series.aHull.push(Math.round(stateA.hull))
  series.aShield.push(Math.round(stateA.shield))
  series.aVital.push(Math.round(stateA.vital))
  series.bHull.push(Math.round(stateB.hull))
  series.bShield.push(Math.round(stateB.shield))
  series.bVital.push(Math.round(stateB.vital))
  series.aDmgCum.push(Math.round(totalDmgA))
  series.bDmgCum.push(Math.round(totalDmgB))
  series.rangeM.push(Math.round(rangeM))
}

function ammoCapacityForProfile(profile) {
  return weaponGroupsForProfile(profile).reduce((sum, group) => {
    const ammo = Number(group.ammoCapacity)
    return sum + (Number.isFinite(ammo) && ammo > 0 ? ammo : 0)
  }, 0)
}

function ammoRemainingForState(state, profile) {
  const groups = weaponGroupsForProfile(profile)
  return groups.reduce((sum, group, i) => {
    const capacity = Number(group.ammoCapacity)
    if (!Number.isFinite(capacity) || capacity <= 0) return sum
    const remaining = Number(state.weaponAmmo?.[i])
    return sum + (Number.isFinite(remaining) ? Math.max(0, remaining) : capacity)
  }, 0)
}

function theoreticalSimDpsForProfile(profile, fallbackDps = 0) {
  const burst = weaponGroupsForProfile(profile).reduce((sum, group) => {
    return sum + Math.max(0, Number(group.simBurstDps) || 0)
  }, 0)
  if (burst > 0) return Math.round(burst)
  return Math.round(Number(fallbackDps) || 0)
}

function weaponCapProfile(ship, pilotSkill) {
  const bank = weaponBankForShip(ship)
  const skill = clampPilotSkill(pilotSkill)
  const skillDelta = skill - PILOT_SKILL_CENTER

  const capacity = clamp(bank.capacity, WEAPON_CAP_MIN, WEAPON_CAP_MAX)
  const regen = clamp(bank.regenPerSec + skill * 0.35, WEAPON_CAP_REGEN_MIN, WEAPON_CAP_REGEN_MAX)
  const discipline = clamp(1 - skillDelta * WEAPON_CAP_SKILL_EFFICIENCY, 0.88, 1.08)
  const drain = clamp(bank.drainPerSec * discipline, WEAPON_CAP_DRAIN_MIN, WEAPON_CAP_DRAIN_MAX)
  const resumePct = WEAPON_CAP_RESUME_MIN + (WEAPON_CAP_RESUME_MAX - WEAPON_CAP_RESUME_MIN) * (skill / 10)

  return {
    capacity,
    regenPerSec: regen,
    drainPerSec: drain,
    resumeAt: capacity * resumePct,
    weaponCount: bank.weaponCount,
    ballisticWeaponCount: bank.ballisticWeaponCount,
    powerPlantOutput: bank.powerPlantOutput,
    powerPlantEnergyRatio: bank.powerPlantEnergyRatio,
    powerPlantRegenMult: bank.powerPlantRegenMult,
    dataSource: bank.dataSource,
    capCostMult: discipline,
    fallbackDps: Number(ship?.dps) || 0,
    weaponGroups: bank.weaponGroups,
  }
}

function weaponBankForShip(ship) {
  const bank = ship?.weaponBank
  if (bank) {
    return {
      capacity: Number(bank.capacity) || WEAPON_CAP_MIN,
      regenPerSec: Number(bank.regenPerSec) || WEAPON_CAP_REGEN_MIN,
      drainPerSec: Number(bank.drainPerSec) || WEAPON_CAP_DRAIN_MIN,
      weaponCount: Number(bank.weaponCount) || 0,
      ballisticWeaponCount: Number(bank.ballisticWeaponCount) || 0,
      powerPlantOutput: Number(bank.powerPlantOutput) || 0,
      powerPlantEnergyRatio: Number(bank.powerPlantEnergyRatio) || 1,
      powerPlantRegenMult: Number(bank.powerPlantRegenMult) || 1,
      dataSource: bank.dataSource ?? 'mock',
      weaponGroups: bank.weaponGroups ?? [],
    }
  }

  const hardpointLoad = Object.entries(ship?.hardpoints ?? {}).reduce((sum, [size, count]) => {
    const n = Number(String(size).replace('S', '')) || 1
    return sum + n * count
  }, 0)
  const dps = Number(ship?.dps) || 0

  return {
    capacity: clamp(72 + hardpointLoad * 7 - dps / 35, WEAPON_CAP_MIN, WEAPON_CAP_MAX),
    regenPerSec: clamp(12 + hardpointLoad * 0.7 + Math.max(0, 240 - dps) / 60, WEAPON_CAP_REGEN_MIN, WEAPON_CAP_REGEN_MAX),
    drainPerSec: clamp(18 + dps * 0.095 + hardpointLoad * 0.45, WEAPON_CAP_DRAIN_MIN, WEAPON_CAP_DRAIN_MAX),
    weaponCount: Object.values(ship?.hardpoints ?? {}).reduce((sum, count) => sum + (Number(count) || 0), 0),
    ballisticWeaponCount: 0,
    powerPlantOutput: 0,
    powerPlantEnergyRatio: 1,
    powerPlantRegenMult: 1,
    dataSource: 'mock',
    weaponGroups: [],
  }
}

function updateWeaponCapacitor(state, profile, wantsFire) {
  const cost = profile.drainPerSec * TICK_RATE

  if (state.capHold && state.weaponCap >= profile.resumeAt) {
    state.capHold = false
  }

  if (wantsFire && !state.capHold && state.weaponCap >= cost) {
    state.weaponCap = Math.max(0, state.weaponCap - cost)
    if (state.weaponCap < cost) state.capHold = true
    return true
  }

  state.weaponCap = Math.min(profile.capacity, state.weaponCap + profile.regenPerSec * TICK_RATE)
  if (state.weaponCap >= profile.resumeAt) {
    state.capHold = false
  }
  return false
}

function rangeAccuracyFactor(rangeM, rOptM) {
  const over = Math.max(0, rangeM - rOptM)
  if (over <= 0) return 1
  const x = over / Math.max(1, rOptM)
  const f = 1 - RANGE_ACC_PENALTY_K * x * x
  return Math.min(1, Math.max(RANGE_ACC_FLOOR, f))
}

function mergeAdvantageBias(pilotSkillA, pilotSkillB) {
  // +bias ayuda a Alfa y perjudica a Beta durante la ventana de merge
  const diff = clampPilotSkill(pilotSkillA) - clampPilotSkill(pilotSkillB) // [-10,10]
  return (diff / 10) * MERGE_SKILL_ADV_MAX
}

function clamp(x, min, max) {
  return Math.min(max, Math.max(min, x))
}

function pctRemaining(value, max) {
  const maxValue = Number(max)
  if (!Number.isFinite(maxValue) || maxValue <= 0) return 0
  return Math.round((Math.max(0, Number(value) || 0) / maxValue) * 100)
}

function detectionForPilot(attackerShip, targetShip, baseDetectionRangeM, pilotSkill) {
  const base = Number(baseDetectionRangeM) || DETECTION_RANGE_DEFAULT_M
  const s = clampPilotSkill(pilotSkill) / 10
  const skillMult = (1 - DETECTION_SKILL_SCALE) + (2 * DETECTION_SKILL_SCALE) * s // [1-scale, 1+scale]

  const radarStrength = Math.max(0.25, Number(attackerShip?.radarStrength) || 1)
  const signatureScore = weightedTargetSignature(targetShip)
  const rangeM = clamp(
    base * radarStrength * skillMult * Math.sqrt(signatureScore),
    200,
    DETECTION_RANGE_MAX_M
  )

  return {
    rangeM,
    radarStrength: parseFloat(radarStrength.toFixed(2)),
    signatureScore: parseFloat(signatureScore.toFixed(2)),
  }
}

function weightedTargetSignature(ship) {
  const sigEM = Math.max(0.1, Number(ship?.sigEM) || 1)
  const sigIR = Math.max(0.1, Number(ship?.sigIR) || 1)
  const sigCS = Math.max(0.1, Number(ship?.sigCS) || 1)
  const profile = Number(ship?.signatureProfile)
  if (Number.isFinite(profile) && profile > 0) return profile
  return Math.max(0.25, 0.42 * sigEM + 0.33 * sigIR + 0.25 * sigCS)
}

function reactionDelaySec(pilotSkill) {
  const s = clampPilotSkill(pilotSkill) / 10
  const t = Math.pow(1 - s, 1.4)
  return REACTION_DELAY_MIN_SEC + (REACTION_DELAY_MAX_SEC - REACTION_DELAY_MIN_SEC) * t
}

function engageAwarenessFactor(hasDetected, isReady) {
  if (!hasDetected) return 0.25
  if (!isReady) return 0.6
  return 1
}

function effectiveAccuracy(ship, pilotSkill) {
  const d = (clampPilotSkill(pilotSkill) - PILOT_SKILL_CENTER) * PILOT_SKILL_STEP
  return clamp01(ship.accuracy + d)
}

function effectiveEvasion(ship, pilotSkill) {
  const d = (clampPilotSkill(pilotSkill) - PILOT_SKILL_CENTER) * PILOT_SKILL_STEP
  return clamp01(ship.evasion + d)
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}

function staticFireRangeM(ship) {
  const groups = Array.isArray(ship?.weaponBank?.weaponGroups) ? ship.weaponBank.weaponGroups : []
  const ranges = groups
    .map(group => Number(group?.rangeM))
    .filter(range => Number.isFinite(range) && range > 0)
  if (ranges.length > 0) return Math.max(...ranges)
  const bankRange = Number(ship?.weaponBank?.rangeM)
  if (Number.isFinite(bankRange) && bankRange > 0) return bankRange
  return FIRE_RANGE_MAX_M
}

function staticFireLabel(fireA, fireB) {
  if (fireA && fireB) return 'ambos bandos disparan'
  if (fireA) return 'solo dispara Alfa'
  if (fireB) return 'solo dispara Beta'
  return 'ningún bando dispara'
}

/** Aplica impactos tipados: escudos, bleed físico y armor de casco. */
function applyDamage(state, impacts, defenderShip) {
  const result = { total: 0, shieldDamage: 0, hullDamage: 0, vitalDamage: 0, byType: {} }
  if (!Array.isArray(impacts) || impacts.length === 0) return result

  impacts.forEach((impact) => {
    const profile = impact.profile && Object.keys(impact.profile).length > 0 ? impact.profile : { energy: 1 }
    Object.entries(profile).forEach(([rawType, fraction]) => {
      const type = normalizeDamageName(rawType)
      const base = (Number(impact.damage) || 0) * (Number(fraction) || 0)
      if (base <= 0) return

      const penetration = penetrationModel(impact.penetration, impact.impactRangeM, impact.weaponRangeM)
      let shieldApplied = 0
      let hullApplied = 0
      let vitalApplied = 0
      const shieldWasDown = state.shield <= 0

      if (state.shield > 0) {
        const bleed = shieldBleedForDamage(type, penetration, defenderShip)
        const shieldMult = shieldMultiplierForDamage(type, defenderShip)
        const shieldRaw = base * (1 - bleed)
        const hullRaw = base * bleed
        const shieldScaled = shieldRaw * shieldMult

        shieldApplied = Math.min(state.shield, shieldScaled)
        state.shield = Math.max(0, state.shield - shieldApplied)

        const overflowRaw = shieldMult > 0
          ? Math.max(0, shieldScaled - shieldApplied) / shieldMult
          : 0
        const hullResult = applyHullDamage(state, hullRaw + overflowRaw, type, penetration, defenderShip, impact.attackerSkill)
        hullApplied = hullResult.total
        vitalApplied = hullResult.vital
      } else {
        const hullResult = applyHullDamage(state, base, type, penetration, defenderShip, impact.attackerSkill)
        hullApplied = hullResult.total
        vitalApplied = hullResult.vital
      }

      const applied = shieldApplied + hullApplied
      if (applied > 0) {
        resetShieldRegenDelay(state, defenderShip, {
          shieldWasDown,
          shieldBecameDown: state.shield <= 0 && !shieldWasDown,
        })
      }

      result.total += applied
      result.shieldDamage += shieldApplied
      result.hullDamage += hullApplied
      result.vitalDamage += vitalApplied
      result.byType[type] = (result.byType[type] ?? 0) + applied
    })
  })

  return result
}

function resetShieldRegenDelay(state, ship, { shieldWasDown = false, shieldBecameDown = false } = {}) {
  const delaySec = shieldWasDown || shieldBecameDown
    ? shieldDownedDelayForShip(ship)
    : shieldDamagedDelayForShip(ship)
  const delayTicks = Math.max(0, Math.round(delaySec / TICK_RATE))
  state.shieldTimer = Math.max(state.shieldTimer ?? 0, delayTicks)
}

function applyHullDamage(state, rawDamage, type, penetration, ship, attackerSkill = PILOT_SKILL_CENTER) {
  if (rawDamage <= 0 || state.vital <= 0) return { total: 0, vital: 0 }

  const applied = rawDamage * hullMultiplierForDamage(type, penetration, ship)
  if (applied <= 0) return { total: 0, vital: 0 }

  let totalApplied = 0
  let vitalApplied = 0
  let remaining = applied

  const directVital = applied * directVitalHitShare(ship, type, penetration, attackerSkill, state.pilotSkill)
  if (directVital > 0) {
    const directVitalApplied = applyToHullPool(state, 'vital', directVital)
    vitalApplied += directVitalApplied
    totalApplied += directVitalApplied
    remaining = Math.max(0, remaining - directVital)
  }

  if (remaining > 0) {
    const nonVitalApplied = applyToHullPool(state, 'nonVital', remaining)
    totalApplied += nonVitalApplied
    remaining = Math.max(0, remaining - nonVitalApplied)
  }

  if (remaining > 0) {
    const overflowVitalApplied = applyToHullPool(state, 'vital', remaining)
    vitalApplied += overflowVitalApplied
    totalApplied += overflowVitalApplied
  }

  syncHullState(state)
  return { total: totalApplied, vital: vitalApplied }
}

function applyToHullPool(state, key, damage) {
  const available = Math.max(0, Number(state?.[key]) || 0)
  if (damage <= 0 || available <= 0) return 0
  const applied = Math.min(available, damage)
  state[key] = Math.max(0, available - applied)
  return applied
}

function syncHullState(state) {
  state.hull = Math.max(0, (Number(state.nonVital) || 0) + (Number(state.vital) || 0))
}

function vitalHullForShip(ship) {
  const hull = Math.max(1, Number(ship?.hullMax) || 1)
  const vital = Number(ship?.vitalHullMax)
  if (!Number.isFinite(vital) || vital <= 0) return hull
  return clamp(vital, Math.min(1, hull), hull)
}

function nonVitalHullForShip(ship) {
  const hull = Math.max(0, Number(ship?.hullMax) || 0)
  return Math.max(0, hull - vitalHullForShip(ship))
}

function directVitalHitShare(ship, type, penetration, attackerSkill = PILOT_SKILL_CENTER, defenderSkill = PILOT_SKILL_CENTER) {
  const base = Number(ship?.vitalTargetChance)
  const targetShare = Number.isFinite(base) ? base : 0.16
  const attacker = clampPilotSkill(attackerSkill) / 10
  const defender = clampPilotSkill(defenderSkill) / 10
  const skillAdvantage = Math.max(0, attacker - defender)
  const vitalHp = Number(ship?.vitalHullMax) || 0
  const bodySizeFactor = clamp01((Math.log(Math.max(1, vitalHp)) - Math.log(1500)) / (Math.log(9000) - Math.log(1500)))
  const targetAgility = targetAgilityScore(ship)
  const targetStability = 1 - targetAgility
  const exposure = targetShare * (0.20 + attacker * 0.55 + bodySizeFactor * 0.18)
  const penetrationBonus = clamp(penetrationArmorBypass(penetration) * 0.05, 0, 0.05)
  const bodySizeBonus = bodySizeFactor * 0.05
  const precisionTargetingBonus = attacker * bodySizeFactor * targetStability * 0.28
  const skillAdvantageBonus = skillAdvantage * (0.16 + bodySizeFactor * 0.22 + targetStability * 0.20)
  const typeBonus = type === 'physical' ? 0.018 : type === 'energy' ? 0.01 : 0
  const defensiveMitigation = defender * (0.06 + (1 - bodySizeFactor) * 0.10 + targetAgility * 0.10)
  return clamp(
    exposure + penetrationBonus + bodySizeBonus + precisionTargetingBonus + skillAdvantageBonus + typeBonus - defensiveMitigation,
    0.04,
    0.68
  )
}

function shieldMultiplierForDamage(type, ship) {
  if (type === 'physical') {
    const resistance = shieldResistanceAvgForShip(ship, 'physical')
    if (Number.isFinite(resistance)) {
      return clamp(1 - resistance, 0.55, 1.05)
    }
    return SHIELD_PHYSICAL_MULT
  }
  if (type === 'distortion') return SHIELD_DISTORTION_MULT
  if (type === 'energy') {
    const resistance = shieldResistanceAvgForShip(ship, 'energy')
    if (Number.isFinite(resistance)) {
      return clamp(1 - resistance, 0.85, 1.35)
    }
    return SHIELD_ENERGY_MULT
  }
  return 0.9
}

function shieldBleedForDamage(type, penetration, ship) {
  if (type !== 'physical') return 0
  const baseBleed = clamp(
    PHYSICAL_SHIELD_BLEED_MIN + penetration.shieldPierce * (PHYSICAL_SHIELD_BLEED_MAX - PHYSICAL_SHIELD_BLEED_MIN),
    PHYSICAL_SHIELD_BLEED_MIN,
    PHYSICAL_SHIELD_BLEED_MAX
  )
  const absorption = shieldAbsorptionAvgForShip(ship, 'physical')
  if (!Number.isFinite(absorption)) return baseBleed
  const absorptionBonus = clamp(1 - absorption, 0.35, 1) * 0.12
  return clamp(baseBleed + absorptionBonus, PHYSICAL_SHIELD_BLEED_MIN, 0.45)
}

function shieldDamagedDelayForShip(ship) {
  const damagedDelay = Number(ship?.shieldDamagedDelay)
  if (Number.isFinite(damagedDelay) && damagedDelay >= 0) return damagedDelay

  const legacyDelay = Number(ship?.shieldCooldown)
  return Number.isFinite(legacyDelay) && legacyDelay >= 0 ? legacyDelay : 5
}

function shieldDownedDelayForShip(ship) {
  const downedDelay = Number(ship?.shieldDownedDelay)
  if (Number.isFinite(downedDelay) && downedDelay >= 0) return downedDelay

  return Math.max(shieldDamagedDelayForShip(ship) * 2, shieldDamagedDelayForShip(ship))
}

function shieldResistanceAvgForShip(ship, type) {
  const avg = Number(ship?.shieldResistance?.[type]?.avg)
  return Number.isFinite(avg) ? avg : null
}

function shieldAbsorptionAvgForShip(ship, type) {
  const avg = Number(ship?.shieldAbsorption?.[type]?.avg)
  return Number.isFinite(avg) ? avg : null
}

function hullMultiplierForDamage(type, penetration, ship) {
  if (type === 'distortion') return 0.12

  const armor = armorReductionForShip(ship)
  if (type === 'physical') {
    const realMultiplier = armorDamageMultiplierForShip(ship, 'physical')
    if (Number.isFinite(realMultiplier)) {
      const effectiveArmor = (1 - realMultiplier) * (1 - penetrationArmorBypass(penetration))
      return clamp(1 - effectiveArmor, 0.45, 1)
    }

    const bypass = penetrationArmorBypass(penetration)
    const effectiveArmor = armor * (1 - bypass)
    return clamp(1 - effectiveArmor, 0.70, 1)
  }
  if (type === 'energy') {
    const energyBypass = Math.min(0.18, penetration.armorPierce * 0.08)
    const realMultiplier = armorDamageMultiplierForShip(ship, 'energy')
    if (Number.isFinite(realMultiplier)) {
      const effectiveArmor = (1 - realMultiplier) * (1 - energyBypass)
      return clamp(1 - effectiveArmor, 0.45, 1)
    }

    return clamp(1 - armor * (1 - energyBypass) * 1.10, 0.62, 1)
  }
  return clamp(1 - armor * 0.85, 0.65, 1)
}

function armorReductionForShip(ship) {
  const explicitArmor = Number(ship?.armorReduction)
  if (Number.isFinite(explicitArmor) && explicitArmor > 0) {
    return clamp(explicitArmor, ARMOR_REDUCTION_MIN, ARMOR_REDUCTION_MAX)
  }

  const realPhysicalMultiplier = armorDamageMultiplierForShip(ship, 'physical')
  if (Number.isFinite(realPhysicalMultiplier)) {
    return clamp(1 - realPhysicalMultiplier, ARMOR_REDUCTION_MIN, ARMOR_REDUCTION_MAX)
  }

  const sizeBase = {
    XS: 0.04,
    S: 0.08,
    M: 0.14,
    L: 0.22,
  }[ship?.size ?? 'S'] ?? 0.08
  const hullBonus = Math.min(0.08, (Number(ship?.hullMax) || 0) / 18000)
  return clamp(sizeBase + hullBonus, ARMOR_REDUCTION_MIN, ARMOR_REDUCTION_MAX)
}

function armorDamageMultiplierForShip(ship, type) {
  const value = Number(ship?.armorDamageMultipliers?.[type])
  return Number.isFinite(value) && value > 0 ? value : null
}

function penetrationModel(penetration, impactRangeM = 0, weaponRangeM = 0) {
  const p = typeof penetration === 'number'
    ? { thickness: penetration, baseDistance: penetration, nearRadius: 0, farRadius: 0 }
    : penetration && typeof penetration === 'object'
      ? penetration
      : {}
  const thickness = Math.max(0, Number(p.thickness) || 0)
  const baseDistance = Math.max(0, Number(p.baseDistance) || 0)
  const nearRadius = Math.max(0, Number(p.nearRadius) || 0)
  const farRadius = Math.max(nearRadius, Number(p.farRadius) || 0)
  const avgRadius = (nearRadius + farRadius) / 2
  const rangeFactor = penetrationRangeFactor(impactRangeM, weaponRangeM)

  const thicknessScore = clamp01(thickness / 0.5)
  const depthScore = clamp01(Math.sqrt(baseDistance / PENETRATION_DEPTH_REF_M))
  const radiusScore = clamp01(Math.sqrt(avgRadius / PENETRATION_RADIUS_REF_M))

  return {
    thickness,
    baseDistance,
    nearRadius,
    farRadius,
    rangeFactor,
    armorPierce: clamp01((thicknessScore * 0.20 + depthScore * 0.60 + radiusScore * 0.20) * rangeFactor),
    shieldPierce: clamp01((thicknessScore * 0.20 + depthScore * 0.35 + radiusScore * 0.45) * rangeFactor),
  }
}

function penetrationArmorBypass(penetration) {
  return clamp(
    PENETRATION_ARMOR_BYPASS_MIN + penetration.armorPierce * (PENETRATION_ARMOR_BYPASS_MAX - PENETRATION_ARMOR_BYPASS_MIN),
    PENETRATION_ARMOR_BYPASS_MIN,
    PENETRATION_ARMOR_BYPASS_MAX
  )
}

function penetrationRangeFactor(impactRangeM, weaponRangeM) {
  const weaponRange = Number(weaponRangeM)
  const impactRange = Number(impactRangeM)
  if (!Number.isFinite(weaponRange) || weaponRange <= 0 || !Number.isFinite(impactRange) || impactRange <= 0) return 1

  const ratio = clamp01(impactRange / weaponRange)
  if (ratio <= PENETRATION_RANGE_FALLOFF_START) return 1

  const t = (ratio - PENETRATION_RANGE_FALLOFF_START) / (1 - PENETRATION_RANGE_FALLOFF_START)
  return clamp(1 - t * (1 - PENETRATION_RANGE_FALLOFF_MIN), PENETRATION_RANGE_FALLOFF_MIN, 1)
}

function normalizeDamageName(type) {
  const t = String(type || '').toLowerCase()
  if (t === 'impact') return 'physical'
  return t || 'energy'
}

/** Regenera escudo si el cooldown ha terminado */
function regenShield(state, ship) {
  if (state.shieldTimer > 0) {
    state.shieldTimer--
  } else {
    state.shield = Math.min(ship.shieldMax, state.shield + ship.shieldRegen * TICK_RATE)
  }
}
