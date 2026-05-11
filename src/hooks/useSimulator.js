/**
 * useSimulator.js — Hook React
 *
 * Puente entre el motor puro (combatEngine.js) y los componentes de UI.
 * Gestiona estado de configuración y resultado.
 * No contiene lógica de combate ni de presentación.
 */

import { useState, useCallback } from 'react'
import { runSimulation } from '../engine/combatEngine'
import { SHIPS } from '../data/ships'

const DEFAULT_CONFIG = {
  shipAId:     'aegs_gladius',
  shipBId:     'anvl_arrow',
  mode:        'timed',    // 'timed' | 'death'
  durationMin: 3,          // minutos (modo timed)
  maxTimeMin:  5,          // minutos máximos (modo death)
  pilotSkillA: 5,          // 0–10, 5 = stats base de la nave
  pilotSkillB: 5,
  multiSim:    false,
  simCount:    10,
  initialRangeKm: 1.5,
  randomRangePerSim: false,
}

export function useSimulator() {
  const [config, setConfig]   = useState(DEFAULT_CONFIG)
  const [runs, setRuns] = useState([])
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const updateConfig = useCallback((patch) => {
    setConfig(prev => ({ ...prev, ...patch }))
    setRuns([])               // resetear resultados al cambiar configuración
    setSelectedRunId(null)
  }, [])

  const selectRun = useCallback((runId) => {
    setSelectedRunId(runId)
  }, [])

  const simulate = useCallback(() => {
    setIsRunning(true)
    setRuns([])
    setSelectedRunId(null)

    // setTimeout(0) para dejar que React actualice la UI antes del cálculo
    setTimeout(() => {
      const shipA = SHIPS[config.shipAId]
      const shipB = SHIPS[config.shipBId]

      const count = config.multiSim ? Math.max(1, Math.min(200, Number(config.simCount) || 1)) : 1
      const createdAt = Date.now()

      const nextRuns = Array.from({ length: count }).map((_, i) => {
        const seed = createdAt + i
        const baseRangeM = Math.max(300, (Number(config.initialRangeKm) || 1.5) * 1000)
        const initialRangeM = config.randomRangePerSim
          ? clampRangeM(baseRangeM * seededUniform(seed, 0.5, 1.5))
          : clampRangeM(baseRangeM)
        const outcome = runSimulation({
          shipA,
          shipB,
          mode:         config.mode,
          durationMin:  config.durationMin,
          maxTimeMin:   config.maxTimeMin,
          pilotSkillA:  config.pilotSkillA,
          pilotSkillB:  config.pilotSkillB,
          seed,
          initialRangeM,
        })

        return {
          id: `${createdAt}-${i}`,
          index: i + 1,
          initialRangeM,
          ...outcome,
          shipA,
          shipB,
        }
      })

      setRuns(nextRuns)
      setSelectedRunId(nextRuns[0]?.id ?? null)
      setIsRunning(false)
    }, 0)
  }, [config])

  const reset = useCallback(() => {
    setRuns([])
    setSelectedRunId(null)
  }, [])

  const selected = runs.find(r => r.id === selectedRunId) ?? runs[0] ?? null
  const isMulti = runs.length > 1

  const summary = isMulti ? buildSummary(runs) : null

  return {
    config,
    updateConfig,
    simulate,
    reset,
    isRunning,
    runs,
    selectedRunId,
    selectRun,
    result: selected,
    summary,
    isMulti,
    ships: SHIPS,
    // Datos de las naves seleccionadas (para previsualización en UI)
    shipA: SHIPS[config.shipAId],
    shipB: SHIPS[config.shipBId],
  }
}

function buildSummary(runs) {
  const total = runs.length
  const winsA = runs.filter(r => r.winner === 'a').length
  const winsB = runs.filter(r => r.winner === 'b').length
  const draws = runs.filter(r => r.winner === 'draw').length

  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)

  const avgDuration = avg(runs.map(r => r.durationSec))
  const avgHullPctA = avg(runs.map(r => r.stats.a.hullPct))
  const avgHullPctB = avg(runs.map(r => r.stats.b.hullPct))
  const avgTotalHpPctA = avg(runs.map(r => r.stats.a.totalHpPct ?? totalHpPctForRun(r, 'a')))
  const avgTotalHpPctB = avg(runs.map(r => r.stats.b.totalHpPct ?? totalHpPctForRun(r, 'b')))
  const avgEffDpsA = avg(runs.map(r => r.stats.a.effectiveDps))
  const avgEffDpsB = avg(runs.map(r => r.stats.b.effectiveDps))
  const avgFireUptimeA = avg(runs.map(r => r.stats.a.fireUptimePct ?? 0))
  const avgFireUptimeB = avg(runs.map(r => r.stats.b.fireUptimePct ?? 0))
  const avgWeaponCapA = avg(runs.map(r => r.stats.a.avgWeaponCapPct ?? 100))
  const avgWeaponCapB = avg(runs.map(r => r.stats.b.avgWeaponCapPct ?? 100))

  return {
    total,
    winsA,
    winsB,
    draws,
    avgDuration,
    avgHullPctA,
    avgHullPctB,
    avgTotalHpPctA,
    avgTotalHpPctB,
    avgEffDpsA,
    avgEffDpsB,
    avgFireUptimeA,
    avgFireUptimeB,
    avgWeaponCapA,
    avgWeaponCapB,
  }
}

function totalHpPctForRun(run, side) {
  const stats = run.stats[side]
  const ship = side === 'a' ? run.shipA : run.shipB
  const totalRemaining = (Number(stats.hullRemaining) || 0) + (Number(stats.shieldRemaining) || 0)
  const totalMax = (Number(ship?.hullMax) || 0) + (Number(ship?.shieldMax) || 0)
  if (totalMax <= 0) return 0
  return Math.round((totalRemaining / totalMax) * 100)
}

function clampRangeM(m) {
  const v = Number(m)
  if (!Number.isFinite(v)) return 1500
  return Math.min(40000, Math.max(300, v))
}

function seededUniform(seed, min, max) {
  // mulberry32
  let a = (seed >>> 0) || 1
  a |= 0
  a = (a + 0x6D2B79F5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return min + (max - min) * r
}
