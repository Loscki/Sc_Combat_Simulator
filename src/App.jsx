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

export default function App() {
  const {
    config, updateConfig,
    simulate, reset,
    isRunning, result,
    runs, selectedRunId, selectRun,
    summary, isMulti,
    shipA, shipB,
    ships,
  } = useSimulator()

  return (
    <div className="app">
      <header className="app-header">
        <h1>SC Combat Simulator</h1>
        <span className="app-version">v0.1 · mock data · Gladius vs Arrow</span>
      </header>

      {/* ── SETUP ── */}
      <section className="setup-section" aria-label="Configuración del combate">
        <div className="ships-grid">
          <ShipCard
            ship={shipA}
            shipId={config.shipAId}
            ships={ships}
            side="a"
            onSelectShip={(nextId) => updateConfig({ shipAId: nextId })}
          />
          <ShipCard
            ship={shipB}
            shipId={config.shipBId}
            ships={ships}
            side="b"
            onSelectShip={(nextId) => updateConfig({ shipBId: nextId })}
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
    </div>
  )
}
