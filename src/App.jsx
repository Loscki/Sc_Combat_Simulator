/**
 * App.jsx — Componente raíz
 *
 * Orquesta el layout y conecta el hook con los componentes.
 * No contiene lógica de simulación ni de presentación de datos.
 */

import { useEffect, useState } from 'react'
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

function runWinnerLabel(result) {
  if (result?.winner === 'a') return `Gana ${result?.shipA?.name ?? 'Nave A'}`
  if (result?.winner === 'b') return `Gana ${result?.shipB?.name ?? 'Nave B'}`
  return 'Empate'
}

function SelectedRunHeader({ result }) {
  const index = result.index ?? 1
  const km = ((Number(result.initialRangeM ?? result.initialRangeMUsed) || 0) / 1000).toFixed(1)
  const winner = runWinnerLabel(result)

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

function SimulationLogicDialog({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="app-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="app-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulation-logic-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-dialog-header">
          <div>
            <div className="section-label">Cómo funciona</div>
            <h2 id="simulation-logic-title">Lógica de la simulación</h2>
          </div>
          <button type="button" className="app-dialog-close" onClick={onClose} aria-label="Cerrar explicación">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="app-dialog-body">
          <div className="app-dialog-block">
            <h3>Qué compara</h3>
            <p>
              El simulador enfrenta dos naves usando sus armas, escudos, casco, body, firmas,
              radar, maniobrabilidad y nivel de piloto.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Cómo evoluciona un combate</h3>
            <p>
              Cada combate avanza por ticks cortos. En cada tick se recalculan detección,
              distancia, ventanas de tiro, consumo de capacitor, disparos, impactos, daño
              a escudo, daño a hull y daño al body.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Precisión</h3>
            <p>
              La precisión representa la facilidad base de una nave para mantener armas sobre el
              objetivo. Parte de los datos de la nave y se deriva principalmente de su capacidad
              de giro, estabilidad de apuntado y configuración de hardpoints.
            </p>
            <p>
              En combate no se usa como un porcentaje de acierto directo. Primero se combina con
              la distancia, la evasión del rival, la diferencia de habilidad entre pilotos y la
              calidad de tracking del momento.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Maniobrabilidad</h3>
            <p>
              La maniobrabilidad resume cuánto control real tiene la nave en dogfight. Combina
              giro en pitch/yaw con la fuerza de sus thrusters: strafe lateral y vertical, boost,
              frenada y capacidad de reposicionarse.
            </p>
            <div className="app-dialog-formula">
              <span>Lectura simplificada</span>
              <code>maniobrabilidad = giro + thrusters</code>
            </div>
            <p>
              Este valor ayuda a estimar si una nave puede sostener una solución de tiro o romper
              la del rival. Por eso una nave ágil no solo esquiva más: también puede generar mejores
              ángulos de ataque.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Evasión</h3>
            <p>
              La evasión mide lo difícil que es convertir disparos en impactos útiles contra esa
              nave. No depende solo de velocidad máxima: también cuentan strafe, boost, roll,
              aceleración, masa, volumen, resistencia total y firma de la nave.
            </p>
            <div className="app-dialog-formula">
              <span>Lectura simplificada</span>
              <code>evasion = agilidad + thrusters - masa/firma/tamaño</code>
            </div>
            <p>
              Una nave pequeña y muy reactiva castiga más el acierto del atacante. Un piloto experto
              reduce parte de esa penalización porque anticipa mejor el movimiento del rival.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Ventana de disparo</h3>
            <p>
              Estar en rango no significa tener una buena oportunidad. La ventana de disparo cuenta
              los momentos en los que la nave está en rango, ha detectado al rival, puede responder
              y tiene suficiente calidad de tracking para convertir ese instante en presión real.
            </p>
            <div className="app-dialog-formula">
              <span>Modelo simplificado</span>
              <code>tracking = piloto + control atacante + distancia - presión defensiva</code>
              <code>oportunidad = control de fuego × probabilidad efectiva de impacto</code>
            </div>
            <p>
              El control atacante usa precisión, maniobrabilidad, strafe, boost y thrusters. La
              presión defensiva usa evasión, strafe, boost, thrusters y habilidad del piloto rival.
              Durante el merge no se reduce la oportunidad por defecto: se trata como un lance
              frontal donde ambas naves pueden disparar, y la ventaja posterior depende de quién
              gira, rolea, tira de morro y conserva mejor el contacto.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Dificultad de pilotaje</h3>
            <p>
              No todas las naves convierten la misma habilidad en el mismo rendimiento. Una nave
              sencilla como la Gladius permite a un piloto medio generar ventanas estables antes.
              Una nave exigente como la Arrow tiene más techo, pero si el piloto no domina su
              velocidad y movimiento lateral, esa agilidad no se convierte automáticamente en
              oportunidad real.
            </p>
            <div className="app-dialog-formula">
              <span>Lectura simplificada</span>
              <code>control útil = habilidad del piloto × dominio de la nave</code>
            </div>
            <p>
              Por eso a igualdad de nivel medio la Gladius debe tender a tener ventanas similares
              o mejores. La Arrow empieza a compensar cuando el piloto ya puede usar su velocidad
              para mantenerse cerca, dificultar el tiro rival y volver a colocar el morro antes.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Errores del piloto</h3>
            <p>
              Un fallo no significa que el simulador elija al azar quién gana. Representa errores
              concretos de ejecución: entrar mal al merge, abrir demasiado la distancia, sobrecorregir
              el giro, perder tracking unos instantes o desaprovechar una ráfaga buena.
            </p>
            <div className="app-dialog-formula">
              <span>Referencia del modelo</span>
              <code>skill 5 = errores frecuentes · skill alto = errores menos frecuentes y menos severos</code>
            </div>
            <p>
              Estos errores generan variación entre combates con pilotos del mismo nivel. Por eso una
              nave favorita debería ganar más veces, pero no todas, especialmente cuando ambos pilotos
              están en niveles medios.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Blackout y carga G</h3>
            <p>
              En combate dinámico, después del merge, el simulador estima cuánta carga G positiva
              soporta el piloto cuando intenta cerrar el giro y volver a poner el morro sobre el rival.
              No basta con que la nave pueda girar mucho: si el piloto fuerza demasiadas G durante
              varios segundos, empieza a perder capacidad de tracking.
            </p>
            <div className="app-dialog-formula">
              <span>Referencia del modelo</span>
              <code>blackout = G positiva sostenida por encima del umbral del piloto</code>
              <code>penalización = menor tracking y peor aprovechamiento de la ventana</code>
            </div>
            <p>
              El umbral se mueve aproximadamente entre 7 y 9 G según habilidad. Un piloto mejor
              dosifica antes, usa mejor roll, strafe y pitch, y tarda más en entrar en penalización.
              Cuando deja de forzar el giro, la carga acumulada se recupera gradualmente.
            </p>
            <p>
              En combate estático este modelo se desactiva para que el modo siga siendo una prueba
              limpia de daño, escudos, body, capacitor y munición.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Cómo afecta al resultado</h3>
            <p>
              La ventana de oportunidad no es daño por sí misma. Es la calidad del momento de tiro.
              Esa calidad modula cuánto tiempo se dispara, qué probabilidad hay de impactar y cuánto
              daño efectivo entra al escudo, hull y body.
            </p>
            <p>
              Por eso dos naves con DPS parecido pueden terminar muy distinto: una nave puede tener
              menos daño teórico, pero si genera mejores ventanas y acierta más, aplicará más daño
              real durante el combate.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Escudos, hull y body</h3>
            <p>
              El daño entra primero al escudo. Cuando el escudo cae, el casco agregado empieza a
              sufrir y una parte del daño puede llegar al body. Si el body llega a cero, la nave
              se considera destruida.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Qué significan los modos</h3>
            <p>
              En duración fija gana quien termina en mejor estado al cerrar el tiempo. En combate
              estático se eliminan maniobras y fallos para probar daño puro, escudos, hull, body,
              capacitor y munición con una distancia fija.
            </p>
            <p>
              En modo estático la ventana se fuerza al máximo: si el arma está en rango y la nave
              está marcada para disparar, impacta. Sirve para separar problemas de daño puro de
              problemas de maniobra, tracking o habilidad.
            </p>
          </div>

          <div className="app-dialog-block">
            <h3>Cómo leer los resultados</h3>
            <p>
              Si quieres saber quién estuvo realmente cerca de morir, mira sobre todo el body
              restante, el hull restante, cuántas veces cayó el escudo a cero y la letalidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [isLogicOpen, setIsLogicOpen] = useState(false)
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
        <div className="app-header-copy">
          <h1>SC Combat Simulator</h1>
          <span className="app-version">v0.1 · armas reales · loadouts configurables</span>
        </div>
        <button
          type="button"
          className="app-header-help"
          onClick={() => setIsLogicOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isLogicOpen}
        >
          <i className="ti ti-info-circle" aria-hidden="true" />
          <span>Cómo funciona</span>
        </button>
      </header>

      <SimulationLogicDialog open={isLogicOpen} onClose={() => setIsLogicOpen(false)} />

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
          shipAName={shipA.name}
          shipBName={shipB.name}
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
