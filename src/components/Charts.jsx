/**
 * Charts.jsx
 * Gráficas principales del combate en formato ancho.
 */

import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

function buildTimeData(series) {
  return series.labels.map((sec, i) => ({
    t: sec,
    aHull: series.aHull[i],
    aShield: series.aShield[i],
    aVital: series.aVital?.[i],
    bHull: series.bHull[i],
    bShield: series.bShield[i],
    bVital: series.bVital?.[i],
    aDmg: series.aDmgCum[i],
    bDmg: series.bDmgCum[i],
    rangeKm: series.rangeM?.[i] != null ? series.rangeM[i] / 1000 : null,
    aGForce: series.aGForce?.[i] ?? 0,
    bGForce: series.bGForce?.[i] ?? 0,
  }))
}

const AXIS_STYLE = { fontSize: 11, fill: '#888780' }
const GRID_STYLE = { stroke: 'rgba(136,135,128,0.15)' }
const LEGEND_STYLE = { fontSize: 11, paddingTop: 10 }
const TICK_INTERVAL = (labels) => Math.max(1, Math.floor(labels.length / 10))

export function Charts({ result }) {
  const [expandedChartId, setExpandedChartId] = useState(null)
  const { series, stats, shipA, shipB } = result
  const timeData = buildTimeData(series)
  const tickInterval = TICK_INTERVAL(series.labels)
  const dpsData = [
    { name: shipA.name, teorico: stats.a.theoreticalDps, efectivo: stats.a.effectiveDps },
    { name: shipB.name, teorico: stats.b.theoreticalDps, efectivo: stats.b.effectiveDps },
  ]

  const charts = [
    {
      id: 'hull-shields',
      title: 'Casco agregado + escudos',
      group: 'Supervivencia',
      render: (height = 280) => (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={timeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="t" tick={AXIS_STYLE} tickFormatter={(v) => `${v}s`} interval={tickInterval} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<CombatChartTooltip unit="HP" />} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Line type="monotone" dataKey="aHull" name={`${shipA.name} casco`} stroke="#378ADD" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="aShield" name={`${shipA.name} escudo`} stroke="#85B7EB" strokeWidth={1.75} strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="bHull" name={`${shipB.name} casco`} stroke="#D85A30" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="bShield" name={`${shipB.name} escudo`} stroke="#EF9F27" strokeWidth={1.75} strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'body',
      title: 'Body en el tiempo',
      group: 'Supervivencia',
      render: (height = 260) => (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={timeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="t" tick={AXIS_STYLE} tickFormatter={(v) => `${v}s`} interval={tickInterval} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<CombatChartTooltip unit="HP" />} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Line type="monotone" dataKey="aVital" name={`${shipA.name} body`} stroke="#378ADD" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="bVital" name={`${shipB.name} body`} stroke="#D85A30" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'damage',
      title: 'Daño acumulado infligido',
      group: 'Daño aplicado',
      render: (height = 260) => (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={timeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="t" tick={AXIS_STYLE} tickFormatter={(v) => `${v}s`} interval={tickInterval} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<CombatChartTooltip unit="" />} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Line type="monotone" dataKey="aDmg" name={`${shipA.name} → ${shipB.name}`} stroke="#378ADD" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="bDmg" name={`${shipB.name} → ${shipA.name}`} stroke="#D85A30" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'dps',
      title: 'DPS simulado vs efectivo',
      group: 'Daño aplicado',
      render: (height = 240) => (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={dpsData} barCategoryGap="22%" margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<CombatChartTooltip unit="" />} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey="teorico" name="DPS sim" fill="rgba(136,135,128,0.30)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="efectivo" name="DPS efectivo" fill="#378ADD" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'range',
      title: 'Distancia entre naves',
      group: 'Maniobra',
      render: (height = 240) => (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={timeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="t" tick={AXIS_STYLE} tickFormatter={(v) => `${v}s`} interval={tickInterval} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} tickFormatter={(v) => `${Number(v).toFixed(1)} km`} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<CombatChartTooltip unit="km" formatter={(value) => `${Number(value).toFixed(2)} km`} />} />
            <Line type="monotone" dataKey="rangeKm" name="Distancia" stroke="rgba(136,135,128,0.90)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'g-force',
      title: 'Fuerzas G estimadas',
      group: 'Maniobra',
      render: (height = 260) => (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={timeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="t" tick={AXIS_STYLE} tickFormatter={(v) => `${v}s`} interval={tickInterval} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} tickFormatter={(v) => `${Number(v).toFixed(0)} G`} axisLine={false} tickLine={false} width={42} domain={[0, 'dataMax + 1']} />
            <Tooltip content={<CombatChartTooltip unit="G" formatter={(value) => `${Number(value).toFixed(1)} G`} />} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <ReferenceLine y={7} stroke="rgba(239,159,39,0.55)" strokeDasharray="4 4" label={{ value: 'riesgo', fill: '#888780', fontSize: 11 }} />
            <Line type="monotone" dataKey="aGForce" name={`${shipA.name} G`} stroke="#378ADD" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="bGForce" name={`${shipB.name} G`} stroke="#D85A30" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
  ]
  const groups = ['Supervivencia', 'Daño aplicado', 'Maniobra'].map((group) => ({
    title: group,
    charts: charts.filter((chart) => chart.group === group),
  }))
  const expandedChart = charts.find((chart) => chart.id === expandedChartId)

  useEffect(() => {
    if (!expandedChartId) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setExpandedChartId(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [expandedChartId])

  return (
    <>
      <div className="charts-groups">
        {groups.map((group) => (
          <section className="charts-group" key={group.title} aria-label={group.title}>
            <div className="charts-group-heading">
              <div className="section-label">{group.title}</div>
            </div>
            <div className="charts-grid">
              {group.charts.map((chart) => (
                <ChartCard
                  key={chart.id}
                  title={chart.title}
                  onExpand={() => setExpandedChartId(chart.id)}
                >
                  {chart.render()}
                </ChartCard>
              ))}
            </div>
          </section>
        ))}
      </div>

      {expandedChart && (
        <div className="chart-modal-backdrop" role="presentation" onClick={() => setExpandedChartId(null)}>
          <div className="chart-modal" role="dialog" aria-modal="true" aria-label={expandedChart.title} onClick={(event) => event.stopPropagation()}>
            <div className="chart-modal-header">
              <div>
                <div className="section-label">{expandedChart.group}</div>
                <h2>{expandedChart.title}</h2>
              </div>
              <button type="button" className="chart-icon-button" onClick={() => setExpandedChartId(null)} aria-label="Cerrar gráfica ampliada">
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <div className="chart-modal-body">
              {expandedChart.render(620)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ChartCard({ title, children, onExpand }) {
  return (
    <div className="card chart-card">
      <div className="chart-card-header">
        <div className="section-label">{title}</div>
        <button type="button" className="chart-icon-button" onClick={onExpand} aria-label={`Ampliar ${title}`}>
          <i className="ti ti-arrows-maximize" aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  )
}

function CombatChartTooltip({ active, payload, label, unit = '', formatter = null }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null

  return (
    <div className="ship-chart-tooltip">
      <div className="ship-chart-tooltip-title">{label != null ? `Tiempo ${label}s` : 'Punto'}</div>
      {payload
        .filter((entry) => entry?.value != null)
        .map((entry) => (
          <div key={entry.dataKey} className="ship-chart-tooltip-line">
            {entry.name}: {formatter ? formatter(entry.value) : formatTooltipValue(entry.value, unit)}
          </div>
        ))}
    </div>
  )
}

function formatTooltipValue(value, unit) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const base = Number.isInteger(n)
    ? n.toLocaleString('es-ES')
    : n.toLocaleString('es-ES', { maximumFractionDigits: 1 })
  return unit ? `${base} ${unit}` : base
}
