import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_BASE_WEAPONS = 'https://api.star-citizen.wiki/api/items?filter%5Bcategory%5D=vehicle-weapons'
const API_BASE_VEHICLES = 'https://api.star-citizen.wiki/api/vehicles'
const API_BASE_ITEMS = 'https://api.star-citizen.wiki/api/items'
const OUT_WEAPONS_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/generated/weapons.generated.js')
const OUT_VEHICLES_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/generated/vehicles.generated.js')
const OUT_COMPONENTS_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/generated/components.generated.js')

const COMPONENT_TYPES = [
  { apiType: 'Shield', catalogType: 'shield_generators' },
  { apiType: 'PowerPlant', catalogType: 'power_plants' },
  { apiType: 'Cooler', catalogType: 'coolers' },
  { apiType: 'Radar', catalogType: 'radar' },
]

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
const weaponBaseCatalog = {}

for (const item of allItems) {
  const normalized = normalizeVehicleWeapon(item)
  if (!normalized) continue
  weaponBaseCatalog[toCatalogKey(item.slug ?? item.class_name)] = normalized
}

const weaponCatalog = { ...weaponBaseCatalog }
for (const [alias, matcher] of Object.entries(INTERNAL_ALIAS_MATCHERS)) {
  const item = allItems.find(matcher)
  const normalized = item ? normalizeVehicleWeapon(item, alias) : null
  if (normalized) weaponCatalog[alias] = normalized
}

const weaponVersions = [...new Set(allItems.map(item => item.version).filter(Boolean))]
const weaponMeta = {
  source: 'Star Citizen Wiki API',
  endpoint: API_BASE_WEAPONS,
  gameVersion: weaponVersions[0] ?? null,
  syncedAt: new Date().toISOString(),
  total: Object.keys(weaponCatalog).length,
}

await mkdir(dirname(OUT_WEAPONS_FILE), { recursive: true })
await writeFile(OUT_WEAPONS_FILE, renderWeaponsModule(weaponCatalog, weaponMeta), 'utf8')

console.log(`Generated ${Object.keys(weaponCatalog).length} weapon entries in ${OUT_WEAPONS_FILE}`)
console.log(`Weapon source version: ${weaponMeta.gameVersion ?? 'unknown'}`)

const allVehicles = await fetchAllVehicles()
const vehicleCatalog = {}
for (const vehicle of allVehicles) {
  const normalized = normalizeVehicle(vehicle)
  if (!normalized) continue
  vehicleCatalog[normalized.id] = normalized
}

const vehicleVersions = [...new Set(allVehicles.map(item => item.version).filter(Boolean))]
const vehicleMeta = {
  source: 'Star Citizen Wiki API',
  endpoint: API_BASE_VEHICLES,
  gameVersion: vehicleVersions[0] ?? null,
  syncedAt: new Date().toISOString(),
  total: Object.keys(vehicleCatalog).length,
}

await writeFile(OUT_VEHICLES_FILE, renderVehiclesModule(vehicleCatalog, vehicleMeta), 'utf8')

console.log(`Generated ${Object.keys(vehicleCatalog).length} vehicle entries in ${OUT_VEHICLES_FILE}`)
console.log(`Vehicle source version: ${vehicleMeta.gameVersion ?? 'unknown'}`)

const allComponents = await fetchAllComponents()
const componentCatalog = {}
for (const item of allComponents) {
  const normalized = normalizeComponent(item)
  if (!normalized) continue
  componentCatalog[normalized.id] = normalized
}

const componentVersions = [...new Set(allComponents.map(item => item.version).filter(Boolean))]
const componentMeta = {
  source: 'Star Citizen Wiki API',
  endpoint: API_BASE_ITEMS,
  gameVersion: componentVersions[0] ?? null,
  syncedAt: new Date().toISOString(),
  total: Object.keys(componentCatalog).length,
}

await writeFile(OUT_COMPONENTS_FILE, renderComponentsModule(componentCatalog, componentMeta), 'utf8')

console.log(`Generated ${Object.keys(componentCatalog).length} component entries in ${OUT_COMPONENTS_FILE}`)
console.log(`Component source version: ${componentMeta.gameVersion ?? 'unknown'}`)

async function fetchAllVehicleWeapons() {
  const first = await fetchJson(`${API_BASE_WEAPONS}&page%5Bnumber%5D=1`)
  const lastPage = Number(first.meta?.last_page) || 1
  const items = [...(first.data ?? [])]

  for (let page = 2; page <= lastPage; page++) {
    const json = await fetchJson(`${API_BASE_WEAPONS}&page%5Bnumber%5D=${page}`)
    items.push(...(json.data ?? []))
  }

  return items
}

async function fetchAllVehicles() {
  const first = await fetchJson(`${API_BASE_VEHICLES}?page%5Bnumber%5D=1`)
  const lastPage = Number(first.meta?.last_page) || 1
  const vehicles = [...(first.data ?? [])]

  for (let page = 2; page <= lastPage; page++) {
    const json = await fetchJson(`${API_BASE_VEHICLES}?page%5Bnumber%5D=${page}`)
    vehicles.push(...(json.data ?? []))
  }

  return fetchVehicleDetails(vehicles)
}

async function fetchAllComponents() {
  const results = []

  for (const { apiType } of COMPONENT_TYPES) {
    const encodedType = encodeURIComponent(apiType)
    const first = await fetchJson(`${API_BASE_ITEMS}?filter%5Btype%5D=${encodedType}&page%5Bnumber%5D=1`)
    const lastPage = Number(first.meta?.last_page) || 1
    results.push(...(first.data ?? []))

    for (let page = 2; page <= lastPage; page++) {
      const json = await fetchJson(`${API_BASE_ITEMS}?filter%5Btype%5D=${encodedType}&page%5Bnumber%5D=${page}`)
      results.push(...(json.data ?? []))
    }
  }

  return results
}

async function fetchVehicleDetails(vehicles) {
  const detailed = []
  const chunkSize = 8

  for (let i = 0; i < vehicles.length; i += chunkSize) {
    const chunk = vehicles.slice(i, i + chunkSize)
    const results = await Promise.all(chunk.map(async (vehicle) => {
      if (!vehicle.slug) return vehicle
      try {
        const json = await fetchJson(`${API_BASE_VEHICLES}/${vehicle.slug}`)
        return json.data ?? vehicle
      } catch {
        return vehicle
      }
    }))
    detailed.push(...results)
  }

  return detailed
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

function normalizeVehicle(vehicle) {
  if (!vehicle?.slug || !vehicle.is_spaceship) return null

  const shield = vehicle.shield ?? {}
  const armor = vehicle.armor ?? {}
  const speed = vehicle.speed ?? {}
  const agility = vehicle.agility ?? {}
  const signature = vehicle.signature ?? {}
  const emission = vehicle.emission ?? {}
  const crossSection = vehicle.cross_section ?? {}
  const weaponry = vehicle.weaponry ?? {}
  const fixedWeapons = weaponry.fixed_weapons?.weapons ?? []

  return stripUndefined({
    id: vehicle.slug,
    name: vehicle.name,
    gameName: vehicle.game_name,
    slug: vehicle.slug,
    className: vehicle.class_name,
    manufacturer: vehicle.manufacturer?.name,
    manufacturerCode: vehicle.manufacturer?.code,
    role: vehicle.role,
    career: vehicle.career,
    foci: Array.isArray(vehicle.foci) ? vehicle.foci : undefined,
    type: vehicle.type,
    sizeClass: toNumber(vehicle.size_class),
    sizeLabel: vehicle.size,
    dimensions: stripUndefined({
      length: toNumber(vehicle.dimension?.length ?? vehicle.sizes?.length),
      width: toNumber(vehicle.dimension?.width ?? vehicle.sizes?.beam),
      height: toNumber(vehicle.dimension?.height ?? vehicle.sizes?.height),
    }),
    mass: stripUndefined({
      hull: toNumber(vehicle.mass_hull),
      loadout: toNumber(vehicle.mass_loadout),
      total: toNumber(vehicle.mass_total ?? vehicle.mass),
    }),
    hullHp: toNumber(vehicle.health),
    shieldHp: firstNumber(shield.hp, vehicle.shield_hp),
    shieldRegen: toNumber(shield.regeneration),
    shieldFaceType: shield.face_type ?? vehicle.shield_face_type,
    shieldResistance: normalizeResistanceMap(shield.resistance),
    shieldAbsorption: normalizeResistanceMap(shield.absorption),
    speed: stripUndefined({
      scm: toNumber(speed.scm),
      max: toNumber(speed.max),
      boostForward: toNumber(speed.boost_forward),
      boostBackward: toNumber(speed.boost_backward),
      zeroToScm: toNumber(speed.zero_to_scm),
      zeroToMax: toNumber(speed.zero_to_max),
    }),
    agility: stripUndefined({
      pitch: toNumber(agility.pitch),
      yaw: toNumber(agility.yaw),
      roll: toNumber(agility.roll),
      pitchBoosted: toNumber(agility.pitch_boosted),
      yawBoosted: toNumber(agility.yaw_boosted),
      rollBoosted: toNumber(agility.roll_boosted),
    }),
    armor: stripUndefined({
      health: toNumber(armor.health),
      damageMultipliers: normalizeFlatNumberMap(armor.damage_multipliers ?? armor.damage_multiplier),
      resistanceMultipliers: normalizeFlatNumberMap(armor.resistance_multipliers ?? armor.resistance_multiplier),
      signalMultipliers: normalizeFlatNumberMap(armor.signal_multipliers ?? armor.signal_multiplier),
      penetrationResistance: normalizeFlatNumberMap(armor.penetration_resistance),
      deflection: normalizeFlatNumberMap(armor.deflection),
    }),
    emission: stripUndefined({
      ir: toNumber(emission.ir),
      emIdle: toNumber(emission.em_idle),
      emMax: toNumber(emission.em_max),
    }),
    signature: stripUndefined({
      irQuantum: toNumber(signature.ir_quantum),
      irShields: toNumber(signature.ir_shields),
      emQuantum: toNumber(signature.em_quantum),
      emShields: toNumber(signature.em_shields),
      emPerSegment: toNumber(signature.em_per_segment),
      emGroupsQuantum: normalizeFlatNumberMap(signature.em_groups_quantum),
      emGroupsShields: normalizeFlatNumberMap(signature.em_groups_shields),
    }),
    crossSection: stripUndefined({
      length: toNumber(crossSection.length),
      width: toNumber(crossSection.width),
      height: toNumber(crossSection.height),
      max: toNumber(vehicle.cross_section_max),
    }),
    hardpoints: normalizeHardpoints(vehicle.components),
    components: normalizeComponents(vehicle.components),
    weaponry: stripUndefined({
      pilotDps: toNumber(weaponry.pilot_dps),
      pilotAlpha: toNumber(weaponry.pilot_alpha),
      pilotSustainedDps: toNumber(weaponry.pilot_sustained_dps),
      fixedDps: toNumber(weaponry.fixed_weapons?.dps_total),
      fixedSustainedDps: toNumber(weaponry.fixed_weapons?.sustained_dps_total),
      fixedAlpha: toNumber(weaponry.fixed_weapons?.alpha_total),
      fixedWeapons: fixedWeapons.map(weapon => stripUndefined({
        name: weapon.name,
        dps: toNumber(weapon.dps),
        sustainedDps: toNumber(weapon.sustained_dps),
        alpha: toNumber(weapon.alpha),
      })),
      missileCount: toNumber(weaponry.missiles?.count),
      totalMissileDamage: toNumber(weaponry.total_missile_damage),
    }),
    source: 'real',
    sourceId: vehicle.id,
    sourceVersion: vehicle.version,
    sourceUpdatedAt: vehicle.updated_at,
    sourceUrl: vehicle.web_url ?? vehicle.link,
  })
}

function normalizeComponent(item) {
  const type = COMPONENT_TYPES.find(entry => entry.apiType === item.type)?.catalogType
  if (!type) return null

  const resource = normalizeResourceNetwork(item.resource_network)

  return stripUndefined({
    id: toCatalogKey(item.slug ?? item.class_name),
    name: item.name,
    className: item.class_name,
    type,
    typeLabel: item.type_label ?? item.type,
    size: toNumber(item.size),
    grade: item.grade,
    class: item.class,
    manufacturer: item.manufacturer?.name,
    manufacturerCode: item.manufacturer?.code,
    shield: normalizeShieldComponent(item.shield),
    powerPlant: normalizePowerPlantComponent(item.power_plant, resource),
    cooler: normalizeCoolerComponent(item.cooler, resource),
    radar: normalizeRadarComponent(item.radar),
    resource,
    emission: stripUndefined({
      ir: toNumber(item.emission?.ir),
      emMin: toNumber(item.emission?.em_min),
      emMax: toNumber(item.emission?.em_max),
      emDecay: toNumber(item.emission?.em_decay),
      emPerSegment: toNumber(item.emission?.em_per_segment),
    }),
    durability: stripUndefined({
      health: toNumber(item.durability?.health),
      resistance: normalizeFlatNumberMap(item.durability?.resistance),
    }),
    source: 'real',
    sourceId: item.slug,
    sourceClassName: item.class_name,
    sourceVersion: item.version,
    sourceUpdatedAt: item.updated_at,
    sourceUrl: item.web_url ?? item.link,
  })
}

function renderWeaponsModule(catalog, meta) {
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

function renderVehiclesModule(catalog, meta) {
  return `/**
 * Catálogo generado de naves de Star Citizen.
 *
 * Fuente: Star Citizen Wiki API.
 * Generado: ${meta.syncedAt}
 * Version datos: ${meta.gameVersion ?? 'desconocida'}
 *
 * No editar a mano. Para actualizarlo ejecuta \`npm run sync:sc-data\`.
 */

export const REAL_VEHICLE_CATALOG = ${JSON.stringify(sortObject(catalog), null, 2)}

export const VEHICLE_DATA_META = ${JSON.stringify(meta, null, 2)}
`
}

function renderComponentsModule(catalog, meta) {
  return `/**
 * Catálogo generado de componentes de Star Citizen.
 *
 * Fuente: Star Citizen Wiki API.
 * Generado: ${meta.syncedAt}
 * Version datos: ${meta.gameVersion ?? 'desconocida'}
 *
 * No editar a mano. Para actualizarlo ejecuta \`npm run sync:sc-data\`.
 */

export const REAL_COMPONENT_CATALOG = ${JSON.stringify(sortObject(catalog), null, 2)}

export const COMPONENT_DATA_META = ${JSON.stringify(meta, null, 2)}
`
}

function normalizeShieldComponent(shield) {
  if (!shield) return undefined
  return stripUndefined({
    maxHealth: firstNumber(shield.max_health, shield.max_shield_health),
    regenRate: firstNumber(shield.regen_rate, shield.max_shield_regen),
    regenTime: toNumber(shield.regen_time),
    downedDelay: toNumber(shield.regen_delay?.downed),
    damagedDelay: toNumber(shield.regen_delay?.damage),
    resistance: normalizeMinMaxMap(shield.resistance),
    absorption: normalizeMinMaxMap(shield.absorption),
  })
}

function normalizePowerPlantComponent(powerPlant, resource) {
  if (!powerPlant && !resource?.generation?.power) return undefined
  return stripUndefined({
    powerOutput: firstNumber(powerPlant?.power_output, powerPlant?.power_segment_generation, resource?.generation?.power),
  })
}

function normalizeCoolerComponent(cooler, resource) {
  if (!cooler && !resource?.generation?.coolant) return undefined
  return stripUndefined({
    coolingRate: firstNumber(cooler?.cooling_rate, cooler?.coolant_segment_generation, resource?.generation?.coolant),
    suppressionIRFactor: toNumber(cooler?.suppression_ir_factor),
    suppressionHeatFactor: toNumber(cooler?.suppression_heat_factor),
  })
}

function normalizeRadarComponent(radar) {
  if (!radar) return undefined
  return stripUndefined({
    cooldown: toNumber(radar.cooldown),
    sensitivity: stripUndefined({
      infrared: toNumber(radar.sensitivity?.infrared),
      crossSection: toNumber(radar.sensitivity?.cross_section),
      electromagnetic: toNumber(radar.sensitivity?.electromagnetic),
      resource: toNumber(radar.sensitivity?.resource),
      db: toNumber(radar.sensitivity?.db),
    }),
    piercing: stripUndefined({
      infrared: toNumber(radar.piercing?.infrared),
      crossSection: toNumber(radar.piercing?.cross_section),
      electromagnetic: toNumber(radar.piercing?.electromagnetic),
      resource: toNumber(radar.piercing?.resource),
      db: toNumber(radar.piercing?.db),
    }),
    aimAssist: stripUndefined({
      minDistance: toNumber(radar.aim_assist?.distance_min_assignment),
      maxDistance: toNumber(radar.aim_assist?.distance_max_assignment),
      outsideBuffer: toNumber(radar.aim_assist?.outside_range_buffer_distance),
    }),
  })
}

function normalizeResourceNetwork(network) {
  if (!network) return undefined
  return stripUndefined({
    usage: stripUndefined({
      powerMin: firstNumber(network.usage?.power?.min, network.usage?.power?.minimum),
      powerMax: firstNumber(network.usage?.power?.max, network.usage?.power?.maximum),
      coolantMin: firstNumber(network.usage?.coolant?.min, network.usage?.coolant?.minimum),
      coolantMax: firstNumber(network.usage?.coolant?.max, network.usage?.coolant?.maximum),
    }),
    generation: stripUndefined({
      power: toNumber(network.generation?.power),
      coolant: toNumber(network.generation?.coolant),
      shield: generatedRate(network, 'Shield'),
    }),
    repair: stripUndefined({
      maxRepairCount: toNumber(network.repair?.max_repair_count),
      timeToRepair: toNumber(network.repair?.time_to_repair),
      healthRatio: toNumber(network.repair?.health_ratio),
    }),
  })
}

function generatedRate(network, generatedResource) {
  const states = Array.isArray(network?.states) ? network.states : []
  for (const state of states) {
    const deltas = Array.isArray(state.deltas) ? state.deltas : []
    const match = deltas.find(delta => delta.generated_resource === generatedResource)
    const value = toNumber(match?.generated_rate)
    if (value !== undefined) return value
  }
  return undefined
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

function normalizeHardpoints(components) {
  const hardpoints = {}
  const weaponComponents = Array.isArray(components)
    ? components.filter(component => component.type === 'weapons')
    : []

  weaponComponents.forEach((component) => {
    const size = toNumber(component.size) ?? toNumber(component.component_size)
    const count = toNumber(component.mounts) ?? toNumber(component.quantity) ?? 1
    if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(count) || count <= 0) return
    const key = `S${Math.round(size)}`
    hardpoints[key] = (hardpoints[key] ?? 0) + Math.round(count)
  })

  return Object.keys(hardpoints).length > 0 ? hardpoints : undefined
}

function normalizeComponents(components) {
  if (!Array.isArray(components)) return undefined

  const keep = new Set(['radar', 'power_plants', 'coolers', 'shield_generators', 'weapons'])
  return components
    .filter(component => keep.has(component.type))
    .map(component => stripUndefined({
      type: component.type,
      name: component.name,
      mounts: toNumber(component.mounts),
      size: component.size,
      componentSize: component.component_size,
      details: component.details,
      category: component.category,
      quantity: toNumber(component.quantity),
    }))
}

function normalizeResistanceMap(map) {
  if (!map || typeof map !== 'object') return undefined
  const result = {}
  Object.entries(map).forEach(([key, value]) => {
    if (!value || typeof value !== 'object') return
    result[key] = stripUndefined({
      min: toNumber(value.minimum),
      max: toNumber(value.maximum),
      avg: averageNumbers(value.minimum, value.maximum),
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

function normalizeMinMaxMap(map) {
  if (!map || typeof map !== 'object') return undefined
  const result = {}
  Object.entries(map).forEach(([key, value]) => {
    if (!value || typeof value !== 'object') return
    result[key] = stripUndefined({
      min: toNumber(value.min ?? value.minimum),
      max: toNumber(value.max ?? value.maximum),
      avg: averageNumbers(value.min ?? value.minimum, value.max ?? value.maximum),
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

function normalizeFlatNumberMap(map) {
  if (!map || typeof map !== 'object') return undefined
  const result = Object.fromEntries(Object.entries(map)
    .map(([key, value]) => [key, toNumber(value)])
    .filter(([, value]) => value !== undefined))
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

function averageNumbers(...values) {
  const numbers = values.map(toNumber).filter(value => value !== undefined)
  if (numbers.length === 0) return undefined
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length
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
