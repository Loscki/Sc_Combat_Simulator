/**
 * Charts.jsx
 * Tres gráficas del resultado usando Recharts:
 *  1. HP + escudos en el tiempo (LineChart)
 *  2. Daño acumulado (LineChart)
 *  3. DPS simulado vs efectivo (BarChart)
 */

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

// Construye el array de datos para Recharts a partir de las series del motor
function buildTimeData(series) {
  return series.labels.map((sec, i) => ({
    t:       sec,
    aHull:   series.aHull[i],
    aShield: series.aShield[i],
    aVital:  series.aVital?.[i],
    bHull:   series.bHull[i],
    bShield: series.bShield[i],
    bVital:  series.bVital?.[i],
    aDmg:    series.aDmgCum[i],
    bDmg:    series.bDmgCum[i],
    rangeKm: series.rangeM?.[i] != null ? series.rangeM[i] / 1000 : null,
  }))
}

const AXIS_STYLE  = { fontSize: 11, fill: '#888780' }
const GRID_STYLE  = { stroke: 'rgba(136,135,128,0.15)' }
const TICK_INTERVAL = (labels) => Math.max(1, Math.floor(labels.length / 8))

export function Charts({ result }) {
  const { series, stats, shipA, shipB } = result
  const timeData = buildTimeData(series)
  const tickInterval = TICK_INTERVAL(series.labels)

  const dpsData = [
    { name: shipA.name, teorico: stats.a.theoreticalDps, efectivo: stats.a.effectiveDps },
    { name: shipB.name, teorico: stats.b.theoreticalDps, efectivo: stats.b.effectiveDps },
  ]

  return (
    <div className="charts-grid">

      {/* Casco agregado + escudos */}
      <div className="card">
        <div className="section-label">Casco agregado + escudos</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={timeData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="t" tick={AXIS_STYLE} tickFormatter={v => v + 's'} interval={tickInterval} />
            <YAxis tick={AXIS_STYLE} />
            <Tooltip formatter={(v, name) => [v + ' HP', name]} labelFormatter={v => v + 's'} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="aHull"   name={`${shipA.name} casco`}   stroke="#378ADD" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="aShield" name={`${shipA.name} escudo`}  stroke="#85B7EB" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            <Line type="monotone" dataKey="bHull"   name={`${shipB.name} casco`}   stroke="#D85A30" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="bShield" name={`${shipB.name} escudo`}  stroke="#EF9F27" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Body */}
      <div className="card">
        <div className="section-label">Body en el tiempo</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={timeData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="t" tick={AXIS_STYLE} tickFormatter={v => v + 's'} interval={tickInterval} />
            <YAxis tick={AXIS_STYLE} />
            <Tooltip formatter={(v, name) => [v + ' HP', name]} labelFormatter={v => v + 's'} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="aVital" name={`${shipA.name} body`} stroke="#378ADD" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="bVital" name={`${shipB.name} body`} stroke="#D85A30" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daño acumulado */}
      <div className="card">
        <div className="section-label">Daño acumulado infligido</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={timeData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="t" tick={AXIS_STYLE} tickFormatter={v => v + 's'} interval={tickInterval} />
            <YAxis tick={AXIS_STYLE} />
            <Tooltip labelFormatter={v => v + 's'} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="aDmg" name={`${shipA.name} → ${shipB.name}`} stroke="#378ADD" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="bDmg" name={`${shipB.name} → ${shipA.name}`} stroke="#D85A30" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* DPS simulado vs efectivo */}
      <div className="card">
        <div className="section-label">DPS simulado vs efectivo</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dpsData} barCategoryGap="30%">
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="name" tick={AXIS_STYLE} />
            <YAxis tick={AXIS_STYLE} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="teorico"  name="DPS sim"      fill="rgba(136,135,128,0.30)" radius={[3,3,0,0]} />
            <Bar dataKey="efectivo" name="DPS efectivo" fill="#378ADD"                 radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distancia */}
      <div className="card">
        <div className="section-label">Distancia entre naves (range)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={timeData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="t" tick={AXIS_STYLE} tickFormatter={v => v + 's'} interval={tickInterval} />
            <YAxis tick={AXIS_STYLE} tickFormatter={(v) => `${v.toFixed(1)} km`} />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(2)} km`, 'Distancia']}
              labelFormatter={v => v + 's'}
            />
            <Line type="monotone" dataKey="rangeKm" name="Distancia" stroke="rgba(136,135,128,0.85)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
