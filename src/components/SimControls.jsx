/**
 * SimControls.jsx
 * Controles de modo (timed / static) y parámetros de duración.
 * Llama a updateConfig del hook y a simulate al pulsar el botón.
 */

export function SimControls({ config, updateConfig, simulate, isRunning }) {
  const isTimed = config.mode === 'timed'
  const isStatic = config.mode === 'static'
  const isMulti = config.multiSim
  const simCount = Number(config.simCount) || 1
  const rangeKm = Number(config.initialRangeKm) || 1.5
  const staticShooterCount = Number(Boolean(config.staticFireA)) + Number(Boolean(config.staticFireB))

  return (
    <div className="card sim-controls">
      {/* Selector de modo */}
      <div className="section-label">Modo de simulación</div>
      <div className="mode-toggle">
        <button
          className={`mode-btn ${isTimed ? 'active' : ''}`}
          onClick={() => updateConfig({ mode: 'timed' })}
        >
          <i className="ti ti-clock" aria-hidden="true" /> Duración fija
        </button>
        <button
          className={`mode-btn ${isStatic ? 'active' : ''}`}
          onClick={() => updateConfig({ mode: 'static' })}
        >
          <i className="ti ti-focus-2" aria-hidden="true" /> Combate estático
        </button>
      </div>

      {!isStatic ? (
        <>
          <div className="section-label">Habilidad del piloto (0–10)</div>
          <p className="sim-hint">
            En 5 se usan precisión y evasión de la ficha. Por debajo bajan ambas; por encima suben.
          </p>
          <div className="pilot-skills">
            <div className="slider-row pilot-skill-row">
              <span className="pilot-skill-label tag tag-blue">Alfa</span>
              <input
                type="range"
                min={0} max={10} step={1}
                value={config.pilotSkillA}
                onChange={e => updateConfig({ pilotSkillA: Number(e.target.value) })}
                aria-label="Habilidad del piloto Alfa"
              />
              <span className="slider-val">{config.pilotSkillA}</span>
            </div>
            <div className="slider-row pilot-skill-row">
              <span className="pilot-skill-label tag tag-coral">Beta</span>
              <input
                type="range"
                min={0} max={10} step={1}
                value={config.pilotSkillB}
                onChange={e => updateConfig({ pilotSkillB: Number(e.target.value) })}
                aria-label="Habilidad del piloto Beta"
              />
              <span className="slider-val">{config.pilotSkillB}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="static-mode-box">
          <div className="section-label">Banco de pruebas estático</div>
          <p className="sim-hint">
            Sin maniobras, sin detección, sin jitter y sin fallos. Solo cuentan rango fijo, daño, escudos, casco, capacitor y munición.
          </p>
        </div>
      )}

      {!isStatic && (
        <>
          <div className="section-label">Simulaciones</div>
          <div className="mode-toggle" role="group" aria-label="Modo de simulación múltiple">
            <button
              className={`mode-btn ${!isMulti ? 'active' : ''}`}
              onClick={() => updateConfig({ multiSim: false })}
            >
              <i className="ti ti-1" aria-hidden="true" /> Única
            </button>
            <button
              className={`mode-btn ${isMulti ? 'active' : ''}`}
              onClick={() => updateConfig({ multiSim: true })}
            >
              <i className="ti ti-stack-2" aria-hidden="true" /> Múltiples
            </button>
          </div>
        </>
      )}

      {!isStatic && isMulti && (
        <div className="slider-section">
          <div className="section-label">Número de simulaciones</div>
          <div className="slider-row">
            <input
              type="range"
              min={2} max={50} step={1}
              value={Math.min(50, Math.max(2, simCount))}
              onChange={e => updateConfig({ simCount: Number(e.target.value) })}
              aria-label="Número de simulaciones"
            />
            <span className="slider-val">{Math.min(50, Math.max(2, simCount))}</span>
          </div>
          <p className="sim-hint">
            Se ejecutarán {Math.min(50, Math.max(2, simCount))} runs con semillas distintas.
          </p>
        </div>
      )}

      <div className="slider-section">
        <div className="section-label">Distancia inicial</div>
        <div className="slider-row">
          <input
            type="range"
            min={0.3} max={40.0} step={0.1}
            value={Math.min(40, Math.max(0.3, rangeKm))}
            onChange={e => updateConfig({ initialRangeKm: Number(e.target.value) })}
            aria-label="Distancia inicial en kilómetros"
          />
          <span className="slider-val">{Math.min(40, Math.max(0.3, rangeKm)).toFixed(1)} km</span>
        </div>

        {!isStatic ? (
          <>
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(config.randomRangePerSim)}
                onChange={(e) => updateConfig({ randomRangePerSim: e.target.checked })}
              />
              <span>Aleatorio para cada simulación</span>
            </label>

            <p className="sim-hint">
              Si está activo, cada run usará una distancia inicial distinta (±50% sobre el valor elegido).
            </p>
          </>
        ) : (
          <p className="sim-hint">
            En este modo la distancia se mantiene fija durante toda la prueba.
          </p>
        )}
      </div>

      {isStatic && (
        <div className="slider-section">
          <div className="section-label">Quién dispara</div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={Boolean(config.staticFireA)}
              onChange={(e) => updateConfig({ staticFireA: e.target.checked })}
            />
            <span>Dispara Alfa</span>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={Boolean(config.staticFireB)}
              onChange={(e) => updateConfig({ staticFireB: e.target.checked })}
            />
            <span>Dispara Beta</span>
          </label>
          <p className="sim-hint">
            Ambos marcados: ambos disparan. Si solo marcas uno, solo dispara ese bando.
          </p>
        </div>
      )}

      {/* Parámetro según modo */}
      <div className="slider-section">
        {isTimed || isStatic ? (
          <>
            <div className="section-label">Duración del combate</div>
            <div className="slider-row">
              <input
                type="range"
                min={1} max={10} step={1}
                value={config.durationMin}
                onChange={e => updateConfig({ durationMin: Number(e.target.value) })}
                aria-label="Duración del combate en minutos"
              />
              <span className="slider-val">{config.durationMin} min</span>
            </div>
          </>
        ) : (
          <>
            <div className="section-label">Tiempo máximo (anti-bucle)</div>
            <div className="slider-row">
              <input
                type="range"
                min={1} max={10} step={1}
                value={config.maxTimeMin}
                onChange={e => updateConfig({ maxTimeMin: Number(e.target.value) })}
                aria-label="Tiempo máximo de simulación en minutos"
              />
              <span className="slider-val">{config.maxTimeMin} min</span>
            </div>
          </>
        )}
      </div>

      {/* Botón de simulación */}
      <button
        className="btn-primary run-btn"
        onClick={simulate}
        disabled={isRunning || (isStatic && staticShooterCount === 0)}
        aria-busy={isRunning}
      >
        <i className="ti ti-player-play" aria-hidden="true" />
        {isRunning ? ' Simulando...' : ' Simular combate'}
      </button>
    </div>
  )
}
