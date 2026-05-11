# SC Combat Simulator — Contexto para Codex

## Qué es este proyecto
Simulador de combate entre naves de Star Citizen. El usuario configura dos naves,
elige modo y duración, y el motor calcula el resultado con gráficas y eventos detallados.

## Stack
- React 18 + Vite
- Recharts (gráficas)
- CSS puro con variables (sin Tailwind, sin CSS-in-JS)
- Sin backend — todo corre en el navegador

## Arquitectura — separación estricta de capas

```
src/
├── data/ships.js          ← Datos de naves. ÚNICA fuente de verdad.
├── engine/combatEngine.js ← Lógica pura. Sin React, sin DOM.
├── hooks/useSimulator.js  ← Puente React ↔ motor.
├── components/            ← UI. Sin lógica de negocio.
│   ├── ShipCard.jsx
│   ├── SimControls.jsx
│   ├── ResultsPanel.jsx
│   ├── Charts.jsx
│   └── EventLog.jsx
├── App.jsx                ← Layout y orquestación únicamente.
└── index.css              ← Todas las clases CSS aquí. Sin estilos inline salvo colores dinámicos.
```

### Regla clave de capas
- Los componentes NO importan `combatEngine.js` directamente → siempre a través del hook.
- El motor NO importa nada de React ni de los datos (`ships.js`) → recibe todo por parámetros.
- Los estilos van en `index.css` → los componentes solo usan nombres de clase.

## Motor de combate — lógica actual

**Tick rate:** 0.1s → 1 minuto = 600 ticks

**Fórmula daño/tick:**
```
dmg = dps × 0.1 × accuracy_atacante × (1 - evasion_defensor)
```

**Escudos:**
- Absorben todo el daño primero; el exceso va al casco
- Cooldown de 5s sin regenerar tras recibir daño
- Regeneran `shieldRegen` HP/s fuera de cooldown

**Modos:**
- `timed`: duración fija en minutos; gana quien tenga más HP+shields al cierre (empate si diff < 5%)
- `death`: hasta 0 HP de casco; tope configurable en minutos

**Output de `runSimulation()`:**
```js
{
  winner,      // 'a' | 'b' | 'draw'
  durationSec,
  events,      // [{ t, text, side }]
  series,      // snapshots cada segundo para gráficas
  stats: {
    a: { hullRemaining, shieldRemaining, hullPct, totalDmgDealt, effectiveDps, theoreticalDps },
    b: { ... }
  }
}
```

## Datos de naves — estructura

```js
{
  id, name, manufacturer, role,
  weapons,        // string[]
  hardpoints,     // { S2: n, S3: n, ... }
  hullMax,        // HP
  shieldMax,      // HP
  shieldRegen,    // HP/s
  shieldCooldown, // segundos
  dps,            // DPS total stock
  accuracy,       // 0–1
  evasion,        // 0–1
  speedSCM,       // m/s (informativo)
  speedBoost,     // m/s (informativo)
}
```

**Datos actuales:** mock basado en conocimiento del juego (patch 3.23/4.0).
**Integración futura:** spviewer.eu — el `id` de cada nave coincide con el slug de la URL
(`/performance?ship=aegs_gladius`). Cuando se integre, solo cambia `ships.js`.

## CSS — convenciones

- Variables en `:root` en `index.css`
- Colores de nave: Alfa `#378ADD` (azul), Beta `#D85A30` (coral)
- Colores de escudo: Alfa `#1D9E75` (teal), Beta `#EF9F27` (amber)
- Dark mode automático via `@media (prefers-color-scheme: dark)`
- Clases semánticas: `.card`, `.section-label`, `.tag`, `.bar-wrap`, `.bar-fill`

## Roadmap (pendiente)

- [ ] Selector de naves — catálogo completo con filtros por fabricante/rol
- [ ] Carga por URL de spviewer.eu
- [ ] Varianza aleatoria por tick (simulaciones no deterministas)
- [ ] Modo equipos (N vs N)
- [ ] Simulación paso a paso con acciones tácticas
- [ ] Exportar resultados a JSON/CSV
- [ ] Tests del motor (`combatEngine.js` es pura, fácil de testear)

## Comandos útiles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
```
