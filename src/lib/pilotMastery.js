export const PILOT_SKILL_CENTER = 5

export function clampPilotSkill(n) {
  return clamp(Number(n) || 0, 0, 10)
}

export function adjustPilotSkillForShip(ship, pilotSkill) {
  const raw = clampPilotSkill(pilotSkill)
  const offset = Number(ship?.pilotSkillOffset) || 0
  const scale = Number(ship?.pilotSkillScale) || 1
  const delta = raw - PILOT_SKILL_CENTER
  const normalized = Math.min(1, Math.abs(delta) / PILOT_SKILL_CENTER)

  if (delta <= 0) {
    const curvedDelta = -PILOT_SKILL_CENTER * Math.pow(normalized, 1.35) * scale
    return clamp(PILOT_SKILL_CENTER + curvedDelta + offset, 0, 10)
  }

  const pivot = clamp(Number(ship?.pilotSkillPivot) || (PILOT_SKILL_CENTER + 1.1), PILOT_SKILL_CENTER + 0.25, 8.5)
  const lowScale = Number(ship?.pilotSkillScaleLow) || Math.max(0.75, scale * 0.9)
  const highScale = Number(ship?.pilotSkillScaleHigh) || Math.min(1.3, scale * 1.05)
  const lowExponent = Math.max(1.05, Number(ship?.pilotSkillExponentLow) || 1.22)

  let curvedDelta
  if (raw <= pivot) {
    const segment = (raw - PILOT_SKILL_CENTER) / Math.max(0.35, pivot - PILOT_SKILL_CENTER)
    curvedDelta = Math.pow(segment, lowExponent) * (pivot - PILOT_SKILL_CENTER) * lowScale
  } else {
    const lowReach = (pivot - PILOT_SKILL_CENTER) * lowScale
    const segment = (raw - pivot) / Math.max(0.35, 10 - pivot)
    curvedDelta = lowReach + Math.pow(segment, 1.08) * (10 - pivot) * highScale
  }

  const unlockedSkill = PILOT_SKILL_CENTER + curvedDelta + offset + masteryUnlockBonus(ship, raw)
  return clamp(unlockedSkill, 0, 10)
}

export function buildPilotEfficiencyCurve(ship, step = 0.1, maneuverabilityPct = null) {
  const samples = []

  for (let skill = 0; skill <= 10.0001; skill += step) {
    const normalizedSkill = round2(skill)
    const adjustedSkill = adjustPilotSkillForShip(ship, normalizedSkill)
    const efficiencyPct = projectedShipUtilizationPct(ship, normalizedSkill, adjustedSkill, maneuverabilityPct)
    samples.push({
      skill: normalizedSkill,
      adjustedSkill: round2(adjustedSkill),
      efficiencyPct,
    })
  }

  return samples
}

function projectedShipUtilizationPct(ship, rawSkill, adjustedSkill, maneuverabilityPct) {
  const demand = clamp(Number(ship?.pilotDemandScore) || 0, 0, 1)
  const pivot = clamp(Number(ship?.pilotSkillPivot) || (PILOT_SKILL_CENTER + 1), PILOT_SKILL_CENTER + 0.25, 8.5)
  const maneuverability = clamp(
    Number(maneuverabilityPct) / 100
    || Number(ship?.combatMetrics?.computed?.maneuverabilityPct) / 100
    || Number(ship?.maneuverabilityPct) / 100
    || 0.65,
    0.35,
    1,
  )
  const baseUtilization = clamp((Number.isFinite(adjustedSkill) ? adjustedSkill : 0) / 10, 0, 1)
  const growthRatio = clamp((clampPilotSkill(rawSkill) - PILOT_SKILL_CENTER) / (10 - PILOT_SKILL_CENTER), 0, 1)
  const unlockProgress = clamp(1.1 * growthRatio - 0.55 * growthRatio * growthRatio, 0, 1)
  const unlockBonus = unlockProgress * demand * maneuverability
  const basePct = clamp(baseUtilization + unlockBonus, 0, 1) * 100
  const ceilingSurplus = Math.max(0, clampPilotSkill(rawSkill) - pivot) * demand * demand * maneuverability * 5
  return Math.round(basePct + ceilingSurplus)
}

function masteryUnlockBonus(ship, rawSkill) {
  void ship
  void rawSkill
  return 0
}

function round2(n) {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
