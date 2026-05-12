import { REAL_COMPONENT_CATALOG, COMPONENT_DATA_META } from './generated/components.generated.js'

export const COMPONENT_CATALOG = REAL_COMPONENT_CATALOG
export const COMPONENT_SOURCE_META = COMPONENT_DATA_META

export const COMPONENT_TYPE_LABELS = {
  shield_generators: 'Escudos',
  power_plants: 'Planta de energía',
  coolers: 'Coolers',
  radar: 'Radar',
}

export const CONFIGURABLE_COMPONENT_TYPES = [
  'shield_generators',
  'power_plants',
  'coolers',
  'radar',
]

export function componentOptionsForSlot(type, size) {
  const targetSize = Number(size)

  return uniqueComponents(Object.values(COMPONENT_CATALOG)
    .filter(component => component.type === type)
    .filter(component => Number(component.size) === targetSize)
    .sort(componentSort))
}

export function componentById(id) {
  return COMPONENT_CATALOG[id] ?? null
}

export function componentLabel(component) {
  if (!component) return 'Componente base'
  const size = Number(component.size) ? `S${component.size}` : ''
  const grade = component.grade ? ` · ${component.grade}` : ''
  const itemClass = component.class ? ` · ${component.class}` : ''
  return `${component.name} ${size}${grade}${itemClass}`.trim()
}

function componentSort(a, b) {
  const gradeA = gradeRank(a.grade)
  const gradeB = gradeRank(b.grade)
  if (gradeA !== gradeB) return gradeA - gradeB
  const classCompare = String(a.class ?? '').localeCompare(String(b.class ?? ''))
  if (classCompare !== 0) return classCompare
  return String(a.name ?? '').localeCompare(String(b.name ?? ''))
}

function uniqueComponents(components) {
  const seen = new Set()
  return components.filter((component) => {
    const key = [
      component.name,
      component.type,
      component.size,
      component.grade,
      component.class,
      component.manufacturer,
    ].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function gradeRank(grade) {
  const g = String(grade ?? '').toUpperCase()
  if (g === 'A') return 1
  if (g === 'B') return 2
  if (g === 'C') return 3
  if (g === 'D') return 4
  return 9
}
