import { REAL_WEAPON_CATALOG, WEAPON_DATA_META } from './generated/weapons.generated.js'
import { MOCK_WEAPON_CATALOG } from './weapons.mock.js'

export const WEAPON_CATALOG = mergeWeaponCatalogs(MOCK_WEAPON_CATALOG, REAL_WEAPON_CATALOG)
export const WEAPON_SOURCE_META = WEAPON_DATA_META
// Escala ligera para heurísticas auxiliares y comparativas resumidas de la nave.
export const WEAPON_DPS_TO_SIM_SCALE = 0.14
// Escala real de daño usada por el motor de combate con datos de armas reales.
export const WEAPON_DAMAGE_TO_SIM_SCALE = 0.26

export function weaponMount(weaponId, count, mount = 'fixed') {
  return { weaponId, count, mount }
}

export function calibratedWeaponDps(weaponBank, fallbackDps = 0) {
  const rawDps = Number(weaponBank?.totalBurstDps) || 0
  const source = weaponBank?.dataSource ?? 'mock'
  if (rawDps > 0 && source !== 'mock') {
    return Math.round(rawDps * WEAPON_DPS_TO_SIM_SCALE)
  }
  return Math.round(Number(fallbackDps) || 0)
}

function mergeWeaponCatalogs(mockCatalog, realCatalog) {
  const merged = { ...mockCatalog }

  Object.entries(realCatalog).forEach(([id, realWeapon]) => {
    const fallback = mockCatalog[id] ?? {}
    merged[id] = {
      ...fallback,
      ...realWeapon,
      id,
      source: realWeapon.source ?? 'real',
    }
  })

  return merged
}
