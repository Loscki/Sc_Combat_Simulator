/**
 * combatEngine.js — Motor de simulación de combate
 *
 * Lógica pura: no importa React, no toca el DOM.
 * Recibe configuración, devuelve resultado completo.
 *
 * ─── MODELO ───────────────────────────────────────────────────
 * Tick rate : 0.1 segundos (TICK_RATE)
 * Fórmula daño/tick:
 *   dmg = ship.dps × TICK_RATE si el disparo impacta
 *
 * Tracking / time-on-target:
 *   - Estar en rango no garantiza disparar cada tick
 *   - Cada piloto necesita una solución de tracking mínima
 *   - Pilotos expertos esperan mejor solución y la sostienen con menos jitter
 *
 * Habilidad del piloto (0–10, default 5):
 *   accEfectiva = clamp01(ship.accuracy + (pilotSkill - 5) × PILOT_SKILL_STEP)
 *   evaEfectiva = clamp01(ship.evasion  + (pilotSkill - 5) × PILOT_SKILL_STEP)
 *
 * Escudos:
 *   - Absorben todo el daño primero; el exceso va al casco
 *   - Tras recibir daño, entran en cooldown (shieldCooldown segundos)
 *   - Durante cooldown no regeneran
 *   - Fuera de cooldown regeneran shieldRegen HP/s
 *
 * Victoria (modo "death"):
 *   - La nave que llega a 0 HP de casco pierde
 *   - Si ambas llegan a 0 simultáneamente → empate
 *   - Si se alcanza el tiempo máximo sin victoria → empate por supervivencia
 *
 * Victoria (modo "timed"):
 *   - Si el casco de una nave llega a 0 antes del límite → misma regla que en "death"
 *   - Si no hay destrucción: al acabar el tiempo gana quien tenga más HP+shields
 *   - Si la diferencia es < 5% → empate técnico
 * ──────────────────────────────────────────────────────────────
 */

export const TICK_RATE      = 0.1   // segundos por tick
export const TICKS_PER_SEC  = Math.round(1 / TICK_RATE)
export const DRAW_THRESHOLD = 0.05  // diferencia mínima para no ser empate

/** Centro de la escala de habilidad (stats de nave sin ajuste) */
export const PILOT_SKILL_CENTER = 5
/** ±0.15 a precisión/evasión en los extremos 0 y 10 */
export const PILOT_SKILL_STEP   = 0.03
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
export const TRACKING_TRIGGER_MIN = 0.30  // skill 0: dispara con soluciones pobres
export const TRACKING_TRIGGER_MAX = 0.45  // skill 10: espera una solucion mas limpia
export const TRACKING_MERGE_PENALTY = 0.08

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
 * @param {'timed'|'death'} config.mode
 * @param {number} config.durationMin — minutos (modo timed)
 * @param {number} config.maxTimeMin  — minutos máximos (modo death)
 * @param {number} [config.pilotSkillA] — 0–10, habilidad piloto Alfa (default 5)
 * @param {number} [config.pilotSkillB] — 0–10, habilidad piloto Beta (default 5)
 * @param {number|string} [config.seed] — semilla RNG para reproducibilidad
 * @param {number} [config.initialRangeM] — distancia inicial en metros
 * @param {number} [config.closingSpeedMps] — velocidad de cierre (m/s)
 * @param {number} [config.minRangeM] — distancia mínima (m)
 * @param {number} [config.detectionRangeM] — rango base de detección (m)
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
}) {
  const maxMins  = mode === 'timed' ? durationMin : maxTimeMin
  const maxTicks = Math.round(maxMins * 60 / TICK_RATE)

  const seedUsed = normalizeSeed(seed)
  const rng = createRng(seedUsed)

  const accA = effectiveAccuracy(shipA, pilotSkillA)
  const evaA = effectiveEvasion(shipA, pilotSkillA)
  const accB = effectiveAccuracy(shipB, pilotSkillB)
  const evaB = effectiveEvasion(shipB, pilotSkillB)
  const vA = dmgVarianceForPilot(pilotSkillA)
  const vB = dmgVarianceForPilot(pilotSkillB)
  const rOptA = rangeOptForPilot(pilotSkillA)
  const rOptB = rangeOptForPilot(pilotSkillB)
  const fireRangeA = fireRangeForPilot(pilotSkillA, rOptA)
  const fireRangeB = fireRangeForPilot(pilotSkillB, rOptB)

  const initialRangeMUsed = Math.max(minRangeM, Number(initialRangeM) || RANGE_INITIAL_M)
  let rangeM = initialRangeMUsed
  let mergeAtSec = null
  let mergeCount = 0

  const detectionA = detectionForPilot(shipA, shipB, detectionRangeM, pilotSkillA)
  const detectionB = detectionForPilot(shipB, shipA, detectionRangeM, pilotSkillB)
  const detectA = detectionA.rangeM
  const detectB = detectionB.rangeM
  let detectedA = false
  let detectedB = false
  let readyAtA = Infinity
  let readyAtB = Infinity

  // Estado mutable de cada nave durante la simulación
  const stateA = {
    hull:        shipA.hullMax,
    shield:      shipA.shieldMax,
    shieldTimer: 0,   // ticks restantes de cooldown
  }
  const stateB = {
    hull:        shipB.hullMax,
    shield:      shipB.shieldMax,
    shieldTimer: 0,
  }

  // Acumuladores
  let totalDmgA = 0   // daño total infligido por A sobre B
  let totalDmgB = 0   // daño total infligido por B sobre A

  // Snapshots para gráficas (1 punto por segundo)
  const series = {
    labels:   [],
    aHull:    [], aShield: [],
    bHull:    [], bShield: [],
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
  events.push({
    t: 0,
    text: `Detección: Alfa ${(detectA / 1000).toFixed(1)} km · Beta ${(detectB / 1000).toFixed(1)} km`,
    side: 'result',
  })

  // Detalle por segundo de disparos (para UI)
  const shots = []
  let secShotsA = 0, secHitsA = 0, secDmgA = 0
  let secShotsB = 0, secHitsB = 0, secDmgB = 0
  let totalShotsA = 0, totalHitsA = 0
  let totalShotsB = 0, totalHitsB = 0

  // Flags de eventos únicos
  const fired = {
    aShieldDown: false, bShieldDown: false,
    aHullHalf:   false, bHullHalf:   false,
    aFirstShots: false, bFirstShots: false,
  }

  let winner     = null
  let finishTick = maxTicks

  // ── LOOP PRINCIPAL ──────────────────────────────────────────
  for (let t = 0; t < maxTicks; t++) {
    const secNow = parseFloat((t * TICK_RATE).toFixed(2))

    // Detección / reacción
    if (!detectedA && rangeM <= detectA) {
      detectedA = true
      readyAtA = secNow + reactionDelaySec(pilotSkillA)
      events.push({ t: secNow, text: `${shipA.name} detecta al objetivo`, side: 'a' })
    }
    if (!detectedB && rangeM <= detectB) {
      detectedB = true
      readyAtB = secNow + reactionDelaySec(pilotSkillB)
      events.push({ t: secNow, text: `${shipB.name} detecta al objetivo`, side: 'b' })
    }

    const prevRangeM = rangeM
    // Range: antes del primer merge cierran; después oscila (puede abrirse y re-mergear)
    if (mergeCount === 0) {
      const closeMps = closingSpeedForRange(rangeM, shipA, shipB, closingSpeedMps)
      rangeM = Math.max(minRangeM, rangeM - closeMps * TICK_RATE)
    } else {
      const effA = clampPilotSkill(pilotSkillA) * engageAwarenessFactor(detectedA, secNow >= readyAtA)
      const effB = clampPilotSkill(pilotSkillB) * engageAwarenessFactor(detectedB, secNow >= readyAtB)
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

    const inMergeWindow = mergeAtSec !== null && (secNow - mergeAtSec) <= MERGE_WINDOW_SEC
    const mergeBias = inMergeWindow ? mergeAdvantageBias(pilotSkillA, pilotSkillB) : 0

    // Disparos por tick (modelo hit/miss)
    const rangeFactorA = rangeAccuracyFactor(rangeM, rOptA)
    const rangeFactorB = rangeAccuracyFactor(rangeM, rOptB)

    const inFireEnvelopeA = detectedA && secNow >= readyAtA && rangeM <= fireRangeA
    const inFireEnvelopeB = detectedB && secNow >= readyAtB && rangeM <= fireRangeB
    const trackingA = inFireEnvelopeA ? trackingQuality(shipA, shipB, pilotSkillA, rangeFactorA, inMergeWindow, rng) : 0
    const trackingB = inFireEnvelopeB ? trackingQuality(shipB, shipA, pilotSkillB, rangeFactorB, inMergeWindow, rng) : 0
    const canFireA = inFireEnvelopeA && trackingA >= triggerThresholdForPilot(pilotSkillA)
    const canFireB = inFireEnvelopeB && trackingB >= triggerThresholdForPilot(pilotSkillB)

    if (canFireA && !fired.aFirstShots) {
      fired.aFirstShots = true
      events.push({ t: secNow, text: `${shipA.name} abre fuego (${Math.round(rangeM)}m · óptimo ~${Math.round(rOptA)}m)`, side: 'a' })
    }
    if (canFireB && !fired.bFirstShots) {
      fired.bFirstShots = true
      events.push({ t: secNow, text: `${shipB.name} abre fuego (${Math.round(rangeM)}m · óptimo ~${Math.round(rOptB)}m)`, side: 'b' })
    }

    const hitChanceA = canFireA ? clamp01((accA * rangeFactorA) * (1 - evaB) * trackingHitFactor(trackingA) + mergeBias) : 0
    const hitChanceB = canFireB ? clamp01((accB * rangeFactorB) * (1 - evaA) * trackingHitFactor(trackingB) - mergeBias) : 0

    const varA = varianceForShot(vA, rangeM, rOptA, inMergeWindow)
    const varB = varianceForShot(vB, rangeM, rOptB, inMergeWindow)
    const shotDmgA = canFireA ? applyVariance(shipA.dps * TICK_RATE, varA, rng) : 0
    const shotDmgB = canFireB ? applyVariance(shipB.dps * TICK_RATE, varB, rng) : 0

    if (canFireA) { secShotsA++; totalShotsA++ }
    if (canFireB) { secShotsB++; totalShotsB++ }

    const hitA = canFireA ? (rng() < hitChanceA) : false
    const hitB = canFireB ? (rng() < hitChanceB) : false

    const dmgAonB = hitA ? shotDmgA : 0
    const dmgBonA = hitB ? shotDmgB : 0

    if (hitA) { secHitsA++; totalHitsA++; secDmgA += dmgAonB }
    if (hitB) { secHitsB++; totalHitsB++; secDmgB += dmgBonA }

    applyDamage(stateB, dmgAonB, shipB.shieldCooldown)
    applyDamage(stateA, dmgBonA, shipA.shieldCooldown)

    // Regeneración de escudos
    regenShield(stateA, shipA)
    regenShield(stateB, shipB)

    totalDmgA += dmgAonB
    totalDmgB += dmgBonA

    // Detección de eventos
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

    // Snapshot por segundo
    if (t % TICKS_PER_SEC === 0) {
      series.labels.push(Math.round(secNow))
      series.aHull.push(Math.round(stateA.hull))
      series.aShield.push(Math.round(stateA.shield))
      series.bHull.push(Math.round(stateB.hull))
      series.bShield.push(Math.round(stateB.shield))
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
    const aDead = stateA.hull <= 0
    const bDead = stateB.hull <= 0
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
  const effDpsA     = durationSec > 0 ? totalDmgA / durationSec : 0
  const effDpsB     = durationSec > 0 ? totalDmgB / durationSec : 0

  return {
    winner,                           // 'a' | 'b' | 'draw'
    durationSec,
    seedUsed,
    initialRangeMUsed,
    mergeAtSec,
    mergeCount,
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
        shieldRemaining: Math.round(stateA.shield),
        hullPct:         pctRemaining(stateA.hull, shipA.hullMax),
        shieldPct:       pctRemaining(stateA.shield, shipA.shieldMax),
        totalHpPct:      pctRemaining(stateA.hull + stateA.shield, shipA.hullMax + shipA.shieldMax),
        totalDmgDealt:   Math.round(totalDmgA),
        effectiveDps:    parseFloat(effDpsA.toFixed(1)),
        theoreticalDps:  shipA.dps,
        shotsFired:      totalShotsA,
        hits:            totalHitsA,
        hitPct:          totalShotsA > 0 ? Math.round((totalHitsA / totalShotsA) * 100) : 0,
      },
      b: {
        hullRemaining:   Math.round(stateB.hull),
        shieldRemaining: Math.round(stateB.shield),
        hullPct:         pctRemaining(stateB.hull, shipB.hullMax),
        shieldPct:       pctRemaining(stateB.shield, shipB.shieldMax),
        totalHpPct:      pctRemaining(stateB.hull + stateB.shield, shipB.hullMax + shipB.shieldMax),
        totalDmgDealt:   Math.round(totalDmgB),
        effectiveDps:    parseFloat(effDpsB.toFixed(1)),
        theoreticalDps:  shipB.dps,
        shotsFired:      totalShotsB,
        hits:            totalHitsB,
        hitPct:          totalShotsB > 0 ? Math.round((totalHitsB / totalShotsB) * 100) : 0,
      },
    },
  }
}

// ── HELPERS INTERNOS ────────────────────────────────────────────

function clampPilotSkill(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return PILOT_SKILL_CENTER
  return Math.min(10, Math.max(0, v))
}

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

function trackingQuality(attackerShip, defenderShip, pilotSkill, rangeFactor, inMergeWindow, rand) {
  const s = clampPilotSkill(pilotSkill) / 10
  const handling = clamp01(0.45 + (attackerShip.accuracy ?? 0.6) * 0.30 + (attackerShip.evasion ?? 0.25) * 0.25)
  const defensivePressure = clamp01(0.18 + (defenderShip.evasion ?? 0.25) * 0.55)
  const jitter = randUniform(rand, -trackingJitterForPilot(pilotSkill), trackingJitterForPilot(pilotSkill))
  const mergePenalty = inMergeWindow ? TRACKING_MERGE_PENALTY * (1 - s) : 0
  return clamp01(0.18 + s * 0.34 + handling * 0.26 + rangeFactor * 0.30 - defensivePressure - mergePenalty + jitter)
}

function trackingJitterForPilot(pilotSkill) {
  const s = clampPilotSkill(pilotSkill) / 10
  return TRACKING_JITTER_MIN + (TRACKING_JITTER_MAX - TRACKING_JITTER_MIN) * (1 - s)
}

function triggerThresholdForPilot(pilotSkill) {
  const s = clampPilotSkill(pilotSkill) / 10
  return TRACKING_TRIGGER_MIN + (TRACKING_TRIGGER_MAX - TRACKING_TRIGGER_MIN) * s
}

function trackingHitFactor(tracking) {
  return clamp(0.70 + tracking * 0.55, 0.70, 1.25)
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

/** Aplica daño a una nave: escudos primero, exceso al casco */
function applyDamage(state, dmg, cooldownSec) {
  if (state.shield > 0) {
    const excess  = Math.max(0, dmg - state.shield)
    state.shield  = Math.max(0, state.shield - dmg)
    state.hull    = Math.max(0, state.hull - excess)
    state.shieldTimer = Math.round(cooldownSec / TICK_RATE)
  } else {
    state.hull = Math.max(0, state.hull - dmg)
  }
}

/** Regenera escudo si el cooldown ha terminado */
function regenShield(state, ship) {
  if (state.shieldTimer > 0) {
    state.shieldTimer--
  } else {
    state.shield = Math.min(ship.shieldMax, state.shield + ship.shieldRegen * TICK_RATE)
  }
}
