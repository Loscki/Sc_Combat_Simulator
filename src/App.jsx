/**
 * App.jsx — Componente raíz
 *
 * Orquesta el layout y conecta el hook con los componentes.
 * No contiene lógica de simulación ni de presentación de datos.
 */

import { useSimulator }   from './hooks/useSimulator'
import { ShipCard }       from './components/ShipCard'
import { SimControls }    from './components/SimControls'
import { ResultsPanel }   from './components/ResultsPanel'
import { Charts }         from './components/Charts'
import { EventLog }       from './components/EventLog'
import { SimRunsSidebar } from './components/SimRunsSidebar'
import { MultiSummaryPanel } from './components/MultiSummaryPanel'
import { ShotLog } from './components/ShotLog'
import { VEHICLE_DATA_META } from './data/generated/vehicles.generated.js'
import { WEAPON_SOURCE_META } from './data/weapons.js'

const RUN_WINNER_LABEL = {
  a: 'Gana Alfa',
  b: 'Gana Beta',
  draw: 'Empate',
}

function SelectedRunHeader({ result }) {
  const index = result.index ?? 1
  const km = ((Number(result.initialRangeM ?? result.initialRangeMUsed) || 0) / 1000).toFixed(1)
  const winner = RUN_WINNER_LABEL[result.winner] ?? 'Resultado'

  return (
    <div className="selected-run-header" aria-label="Simulación seleccionada">
      <div className="selected-run-title-block">
        <div className="section-label">Simulación seleccionada</div>
        <h2>Simulación #{index}</h2>
        <p>{result.shipA.name} vs {result.shipB.name}</p>
      </div>
      <div className="selected-run-meta">
        <span>{winner}</span>
        <span>{Math.round(result.durationSec)}s</span>
        <span>{km} km iniciales</span>
      </div>
    </div>
  )
}

export default function App() {
  const {
    config, updateConfig,
    updateShipWeapon, updateShipComponent,
    simulate, reset,
    isRunning, result,
    runs, selectedRunId, selectRun,
    summary, isMulti,
    shipA, shipB,
    ships,
  } = useSimulator()

  const dataSourceLabel = VEHICLE_DATA_META?.source ?? 'Star Citizen Wiki API'
  const dataVersion = VEHICLE_DATA_META?.gameVersion ?? WEAPON_SOURCE_META?.gameVersion ?? null

  return (
    <div className={`app ${isMulti ? 'has-run-history' : ''}`}>
      <header className="app-header">
        <h1>SC Combat Simulator</h1>
        <span className="app-version">v0.1 · armas reales · loadouts configurables</span>
      </header>

      {/* ── SETUP ── */}
      <section className="setup-section" aria-label="Configuración del combate">
        <div className="ships-grid">
          <ShipCard
            ship={shipA}
            shipId={config.shipAId}
            pilotSkill={config.pilotSkillA}
            ships={ships}
            side="a"
            onSelectShip={(nextId) => updateConfig({ shipAId: nextId, shipALoadoutId: 'stock', shipACustomConfig: { weaponsBySlot: {}, components: {} } })}
            onSelectWeapon={(slotId, weaponId) => updateShipWeapon('a', slotId, weaponId)}
            onSelectComponent={(componentType, componentId) => updateShipComponent('a', componentType, componentId)}
            onPilotSkillChange={(value) => updateConfig({ pilotSkillA: value })}
          />
          <ShipCard
            ship={shipB}
            shipId={config.shipBId}
            pilotSkill={config.pilotSkillB}
            ships={ships}
            side="b"
            onSelectShip={(nextId) => updateConfig({ shipBId: nextId, shipBLoadoutId: 'stock', shipBCustomConfig: { weaponsBySlot: {}, components: {} } })}
            onSelectWeapon={(slotId, weaponId) => updateShipWeapon('b', slotId, weaponId)}
            onSelectComponent={(componentType, componentId) => updateShipComponent('b', componentType, componentId)}
            onPilotSkillChange={(value) => updateConfig({ pilotSkillB: value })}
          />
        </div>
        <SimControls
          config={config}
          updateConfig={updateConfig}
          simulate={simulate}
          isRunning={isRunning}
        />
      </section>

      {/* ── RESULTADOS ── */}
      {result && (
        <section className="results-section" aria-label="Resultados de la simulación">
          <div className={`results-layout ${isMulti ? 'is-multi' : ''}`}>
            {isMulti && (
              <SimRunsSidebar
                runs={runs}
                selectedRunId={selectedRunId}
                onSelectRun={selectRun}
              />
            )}

            <div className="results-main">
              {isMulti && (
                <MultiSummaryPanel
                  summary={summary}
                  shipAName={result.shipA.name}
                  shipBName={result.shipB.name}
                />
              )}

              {isMulti && <SelectedRunHeader result={result} />}

              <ResultsPanel result={result} onReset={reset} />
              <div className="charts-and-log">
                <Charts result={result} />
                <ShotLog shots={result.shots} shipAName={result.shipA.name} shipBName={result.shipB.name} />
                <EventLog events={result.events} />
              </div>
            </div>
          </div>
        </section>
      )}

      <aside className="data-attribution" aria-label="Fuente de datos">
        <span>Datos: {dataSourceLabel}</span>
        {dataVersion ? <span>Versión: {dataVersion}</span> : null}
        <span>Sin SPViewer</span>
      </aside>
    </div>
  )
}
