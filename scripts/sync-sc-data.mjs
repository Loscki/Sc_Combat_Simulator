import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_BASE = 'https://api.star-citizen.wiki/api/items?filter%5Bcategory%5D=vehicle-weapons'
const OUT_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/generated/weapons.generated.js')

const INTERNAL_ALIAS_MATCHERS = {
  cf_117_badger: item => item.class_name === 'KLWE_LaserRepeater_S1',
  cf_227_panther: item => item.class_name === 'KLWE_LaserRepeater_S2',
  cf_337_panther: item => item.class_name === 'KLWE_LaserRepeater_S3',
  laser_repeater_s2: item => item.class_name === 'KLWE_LaserRepeater_S2',
  laser_cannon_s1: item => item.class_name === 'BEHR_LaserCannon_S1',
  laser_cannon_s2: item => item.class_name === 'BEHR_LaserCannon_S2',
  laser_cannon_s3: item => item.class_name === 'BEHR_LaserCannon_S3',
}

const allItems = await fetchAllVehicleWeapons()
const baseCatalog = {}

for (const item of allItems) {
  const normalized = normalizeVehicleWeapon(item)
  if (!normalized) continue
  baseCatalog[toCatalogKey(item.slug ?? item.class_name)] = normalized
}

const catalog = { ...baseCatalog }
for (const [alias, matcher] of Object.entries(INTERNAL_ALIAS_MATCHERS)) {
  const item = allItems.find(matcher)
  const normalized = item ? normalizeVehicleWeapon(item, alias) : null
  if (normalized) catalog[alias] = normalized
}

const versions = [...new Set(allItems.map(item => item.version).filter(Boolean))]
const meta = {
  source: 'Star Citizen Wiki API',
  endpoint: API_BASE,
  gameVersion: versions[0] ?? null,
  syncedAt: new Date().toISOString(),
  total: Object.keys(catalog).length,
}

await mkdir(dirname(OUT_FILE), { recursive: true })
await writeFile(OUT_FILE, renderModule(catalog, meta), 'utf8')

console.log(`Generated ${Object.keys(catalog).length} weapon entries in ${OUT_FILE}`)
console.log(`Source version: ${meta.gameVersion ?? 'unknown'}`)

async function fetchAllVehicleWeapons() {
  const first = await fetchJson(`${API_BASE}&page%5Bnumber%5D=1`)
  const lastPage = Number(first.meta?.last_page) || 1
  const items = [...(first.data ?? [])]

  for (let page = 2; page <= lastPage; page++) {
    const json = await fetchJson(`${API_BASE}&page%5Bnumber%5D=${page}`)
    items.push(...(json.data ?? []))
  }

  return items
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'SC Combat Simulator data sync',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

function normalizeVehicleWeapon(item, idOverride) {
  const weapon = item.vehicle_weapon
  if (!weapon || item.classification !== 'Ship.Weapon.Gun') return null

  const mode = (weapon.modes ?? []).find(m => toNumber(m.damage_per_second) > 0) ?? weapon.modes?.[0] ?? {}
  const ammo = weapon.ammunition ?? item.ammunition ?? {}
  const capacitor = weapon.capacitor ?? {}
  const damage = weapon.damage ?? {}
  const spread = weapon.spread ?? {}
  const resource = item.resource_network ?? {}
  const emission = item.emission ?? {}
  const durability = item.durability ?? {}

  const id = idOverride ?? toCatalogKey(item.slug ?? item.class_name)
  const ammoCapacity = firstNumber(ammo.initial_capacity, ammo.capacity, weapon.capacity)

  return stripUndefined({
    id,
    name: item.name,
    type: weapon.type ?? item.sub_type_label ?? item.type_label,
    size: toNumber(item.size),
    ammo: ammoCapacity > 0 ? ammoCapacity : null,
    burstDps: firstNumber(damage.burst, mode.damage_per_second),
    alpha: firstNumber(damage.alpha_total, weapon.damage_per_shot),
    rpm: firstNumber(weapon.rpm, mode.rounds_per_minute, mode.rpm),
    speed: toNumber(ammo.speed),
    range: firstNumber(weapon.range, ammo.range),
    spreadMax: firstNumber(spread.max, spread.maximum),
    damageTypes: normalizeDamageTypes(weapon),
    penetration: normalizePenetration(ammo),
    power: firstNumber(resource.usage?.power?.max, resource.usage?.power?.maximum),
    emMax: firstNumber(emission.em_max, emission.em?.max),
    health: toNumber(durability.health),
    capacitorAmmo: toNumber(capacitor.max_ammo_load),
    capacitorRegen: firstNumber(capacitor.regen_per_second, weapon.regeneration),
    capacitorCostPerShot: toNumber(capacitor.costs_per_shot),
    source: 'real',
    sourceId: item.slug,
    sourceClassName: item.class_name,
    sourceVersion: item.version,
    sourceUpdatedAt: item.updated_at,
    sourceUrl: item.web_url ?? item.link,
  })
}

function renderModule(catalog, meta) {
  return `/**
 * Catálogo generado de armas de Star Citizen.
 *
 * Fuente: Star Citizen Wiki API.
 * Generado: ${meta.syncedAt}
 * Version datos: ${meta.gameVersion ?? 'desconocida'}
 *
 * No editar a mano. Para actualizarlo ejecuta \`npm run sync:sc-data\`.
 */

export const REAL_WEAPON_CATALOG = ${JSON.stringify(sortObject(catalog), null, 2)}

export const WEAPON_DATA_META = ${JSON.stringify(meta, null, 2)}
`
}

function normalizeDamageTypes(weapon) {
  const alpha = weapon.damage?.alpha ?? {}
  const fromAlpha = Object.fromEntries(Object.entries(alpha)
    .map(([type, value]) => [type.toLowerCase(), toNumber(value)])
    .filter(([, value]) => value !== undefined && value > 0))

  if (Object.keys(fromAlpha).length > 0) return fromAlpha

  const damages = Array.isArray(weapon.damages) ? weapon.damages : []
  const fromDamages = Object.fromEntries(damages
    .map(entry => [String(entry.name ?? entry.type ?? '').toLowerCase(), toNumber(entry.damage)])
    .filter(([type, value]) => type && value !== undefined && value > 0))

  return Object.keys(fromDamages).length > 0 ? fromDamages : undefined
}

function normalizePenetration(ammo) {
  const penetration = ammo?.penetration ?? {}
  const result = stripUndefined({
    thickness: toNumber(ammo?.max_penetration_thickness),
    baseDistance: toNumber(penetration.base_distance),
    nearRadius: toNumber(penetration.near_radius),
    farRadius: toNumber(penetration.far_radius),
  })

  return Object.keys(result).length > 0 ? result : undefined
}

function sortObject(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))
}

function stripUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined && value !== null))
}

function firstNumber(...values) {
  for (const value of values) {
    const n = toNumber(value)
    if (n !== undefined) return n
  }
  return undefined
}

function toNumber(value) {
  if (value === 'Infinite') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function toCatalogKey(value) {
  return String(value ?? '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
