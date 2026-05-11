# SC Combat Simulator - Historial para IA

Este archivo sirve para dar contexto a otros modelos de IA sobre los cambios
hechos en el proyecto y las decisiones de diseno. Antes de pedir trabajo a otro
modelo, comparte este archivo junto con `AGENTS.md` o `CLAUDE.md`.

## Como actualizar este archivo

Cada vez que se haga un cambio relevante, anadir una entrada nueva arriba del
historial con:

- fecha;
- objetivo del cambio;
- archivos tocados;
- decision tecnica o de simulacion;
- verificaciones realizadas;
- riesgos o siguientes pasos.

No borrar entradas antiguas: este archivo es memoria historica del proyecto.

## Estado actual resumido

- App React 18 + Vite, sin backend.
- Motor puro en `src/engine/combatEngine.js`.
- Datos de naves en `src/data/ships.js`.
- React solo orquesta y muestra resultados; la UI no debe duplicar logica de
  combate.
- La deteccion usa una calibracion interna base de 20 km; ya no hay slider
  publico de rango de deteccion.
- La distancia inicial puede configurarse hasta 40 km.
- El motor separa rango optimo de disparo y rango maximo de apertura de fuego.
- El motor exige una solucion de tracking/time-on-target antes de disparar.
- La deteccion compara radar del atacante contra firma EM/IR/CS del objetivo.
- El resultado expone disparos, impactos y porcentaje de acierto por nave.

## Historial

### 2026-05-11 - Municion balistica finita y armor

Objetivo:
Refinar el combate para que las armas balisticas no se comporten como armas de
energia infinitas, y empezar a separar dano contra escudos y dano real al casco
segun tipo de arma, penetracion y armor del objetivo.

Archivos tocados:
- `scripts/sync-sc-data.mjs`
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `src/components/ResultsPanel.jsx`
- `src/components/ShipCard.jsx`
- `AI_CHANGELOG.md`

Decision:
Los grupos de armas ahora pueden declarar:
- `ammoCapacity`;
- `ammoPerWeapon`;
- `penetration`;
- perfil de dano por tipo.

Las balisticas:
- consumen municion finita por proyectil;
- no consumen capacitor de armas;
- dejan de disparar cuando agotan municion;
- exponen municion gastada, restante y porcentaje de tiempo seco.

El motor ahora aplica impactos tipados:
- `energy`: buen dano a escudos, dano a casco reducido por armor;
- `physical`: menor dano directo a escudos, pero parte puede sangrar al casco;
- `distortion`: fuerte contra escudos, muy bajo contra casco.

El armor del casco se infiere de tamano y HP de la nave. La penetracion del arma
reduce esa mitigacion, especialmente en dano fisico. El importador intenta
guardar datos de penetracion reales cuando la API los expone; si no existen, el
simulador usa una inferencia conservadora por tipo de arma.

UI:
- Las tarjetas de nave muestran `Municion`.
- Los resultados muestran municion restante, municion total y tiempo seco.
- `Dano infligido` separa dano a escudo y dano a casco, ademas del desglose por
  tipo (`energy`, `physical`, `distortion`).

Verificacion:
- `npm run build` correcto.
- Visualizador recargado y validado: aparecen `Municion`, `Sin municion finita`
  en armas de energia, y el desglose `escudo/casco`.
- Prueba Gladius vs Arrow:
  - combate resuelto correctamente;
  - el dano se separa en escudo y casco;
  - los resultados siguen mostrando disparos, impactos y acierto.
- Prueba artificial con arma balistica y 120 proyectiles:
  - la nave gasto los 120 proyectiles;
  - la municion restante quedo en 0;
  - el resultado registro tiempo seco;
  - el dano fisico se repartio entre escudo y casco.

Riesgos / siguientes pasos:
- `npm run sync:sc-data` fallo por DNS (`api.star-citizen.wiki` no resolvio),
  por lo que el importador esta preparado pero el catalogo generado aun no se
  ha refrescado con campos reales de penetracion.
- Las naves jugables actuales usan sobre todo armas de energia; conviene anadir
  o seleccionar loadouts balisticos reales para calibrar bien municion y
  penetracion.
- Ajustar constantes de armor, bleed y multiplicadores cuando comparemos contra
  referencias de Star Citizen.

### 2026-05-11 - Fuego por arma, cadencia y tipos de dano

Objetivo:
Dejar de tratar el armamento como una unica masa de DPS por tick y empezar a
simular proyectiles/tiros por grupo de armas, usando RPM, alpha calibrado,
consumo por disparo y tipo de dano.

Archivos tocados:
- `scripts/sync-sc-data.mjs`
- `src/data/generated/weapons.generated.js`
- `src/data/weapons.mock.js`
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `src/components/ResultsPanel.jsx`
- `src/components/Charts.jsx`
- `AI_CHANGELOG.md`

Decision:
El importador real ahora guarda `damageTypes` cuando la API lo expone. Para
armas sin desglose explicito, el simulador infiere:
- ballistic -> `physical`;
- distortion -> `distortion`;
- resto -> `energy`.

`ships.js` genera ahora `weaponBank.weaponGroups`, con datos por grupo:
- nombre/tipo/size;
- numero de armas;
- RPM;
- intervalo de disparo;
- alpha bruto;
- alpha simulado;
- DPS bruto y DPS simulado;
- rango;
- velocidad de proyectil;
- spread;
- coste de capacitor por disparo;
- perfil de dano por tipo.

Motor:
- Cada grupo de armas acumula carga de cadencia (`weaponCharge`).
- Cuando el piloto tiene ventana de fuego, cada grupo dispara segun su RPM.
- Cada proyectil consume capacitor individualmente.
- Cada proyectil puede acertar o fallar.
- El dano de impacto usa `simAlpha` con varianza.
- El dano se reparte por tipo (`energy`, `physical`, `distortion`, etc.).
- `shotsFired` ahora representa proyectiles/tiros de arma, no ticks de fuego.

UI:
- `ResultsPanel` muestra `Dano infligido` y desglose por tipo.
- La grafica se renombro a `DPS simulado vs efectivo` para evitar confundirlo
  con el DPS bruto de tabla.

Verificacion:
- `npm run sync:sc-data` correcto, regenerando armas con `damageTypes`.
- `npm run build` correcto.
- Prueba Gladius vs Arrow skill 5:
  - ganador Alfa;
  - duracion aprox 70s;
  - Gladius: 891 disparos, 371 impactos, dano energy 1648;
  - Arrow: 761 disparos, 326 impactos, dano energy 1199.
- Prueba skill 10 vs skill 0:
  - el experto mantiene mayor porcentaje de impacto;
  - el novato dispara mucho, pero convierte menos impactos.
- Visualizador recargado; se confirmo `Dano infligido`, `energy:` y
  `DPS simulado vs efectivo`.

Riesgos / siguientes pasos:
- El modelo ya usa RPM/alpha por arma, pero el capacitor sigue siendo comun por
  banco de armas, no por arma individual.
- Siguiente refinamiento recomendado: diferenciar balisticas con municion finita
  y separar penetracion/armor frente a escudos.

### 2026-05-11 - DPS de simulacion derivado del loadout real

Objetivo:
Pasar del `ship.dps` escrito a mano a un DPS de simulacion derivado del armamento
real importado, sin usar directamente el `Burst DPS` bruto de la tabla porque
eso acorta los combates de forma excesiva.

Archivos tocados:
- `src/data/weapons.js`
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `AI_CHANGELOG.md`

Decision:
Se anadio una escala global inicial:

```js
WEAPON_DPS_TO_SIM_SCALE = 0.14
```

Motivo:
Al comparar las naves actuales, el DPS manual historico estaba concentrado en
torno al 12-18% del `Burst DPS` real del loadout. La escala `0.14` conserva
duraciones razonables y permite que el reparto relativo de dano empiece a salir
de las armas reales.

Cambios de datos:
- `weaponBank.totalBurstDps` sigue guardando el DPS bruto real.
- `calibratedWeaponDps()` calcula el DPS que usa la simulacion.
- `ship.legacyDps` conserva el valor manual anterior.
- `ship.dps` pasa a ser el DPS calibrado usado por el motor.
- `ship.dpsSource` indica si viene de datos `real`, `mixed` o `mock`.

Motor:
- El dano por tick sigue usando `ship.dps`, pero ahora ese valor ya es
  real-derivado cuando hay armas reales.
- `stats` expone:
  - `theoreticalDps` como DPS simulado;
  - `rawWeaponDps` como DPS bruto del loadout;
  - `legacyDps` como referencia anterior;
  - `dpsSource`.

UI:
- Las tarjetas muestran `DPS sim`.
- Tambien muestran el DPS bruto del armamento: `raw X`.
- En resultados, `DPS efectivo` muestra:
  `Teorico sim: X · raw armas: Y`.

Verificacion:
- `npm run build` correcto.
- Valores principales tras calibracion:
  - Gladius: raw 1202 -> DPS sim 168.
  - Arrow: raw 656 -> DPS sim 92.
  - Super Hornet: raw 2076 -> DPS sim 291.
  - Buccaneer: raw 1679 -> DPS sim 235.
- Prueba Gladius vs Arrow skill 5:
  - ganador Alfa;
  - duracion 55.4s;
  - Gladius DPS efectivo 29.4;
  - Arrow DPS efectivo 15.9.
- Visualizador recargado; se confirmo que aparecen `DPS sim`, `raw armas` y
  `Teorico sim`.

Riesgos / siguientes pasos:
- La escala `0.14` es una calibracion inicial, no una verdad del juego.
- Siguiente refinamiento: separar dano por tipo de arma y cadencia real de
  disparo, en lugar de aplicar una escala unica al DPS total.

### 2026-05-11 - Primer importador de datos reales de armas

Objetivo:
Empezar a reemplazar mocks de armamento por datos reales, sin romper el flujo de
simulacion ni depender al 100% de una fuente externa para cada campo.

Archivos tocados:
- `scripts/sync-sc-data.mjs`
- `package.json`
- `src/data/weapons.js`
- `src/data/weapons.mock.js`
- `src/data/generated/weapons.generated.js`
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `src/index.css`
- `AI_CHANGELOG.md`

Fuente:
- Star Citizen Wiki API:
  `https://api.star-citizen.wiki/api/items?filter%5Bcategory%5D=vehicle-weapons`
- Version importada:
  `4.7.2-LIVE.11674325`

Decision:
Se implemento un modelo hibrido:
- `weapons.generated.js` contiene armas reales normalizadas desde la API.
- `weapons.mock.js` mantiene fallback manual.
- `weapons.js` combina ambos catalogos, priorizando datos reales.
- `ships.js` sigue definiendo las naves, pero sus `weaponLoadout` resuelven
  contra el catalogo combinado.

El script `npm run sync:sc-data` descarga todas las paginas de armas de nave y
normaliza:
- nombre;
- tipo;
- size;
- ammo;
- burst DPS;
- alpha;
- RPM;
- velocidad de proyectil;
- rango;
- spread;
- power;
- EM;
- health;
- datos de capacitor si existen (`max_ammo_load`, `regen_per_second`,
  `costs_per_shot`).

Se anadieron aliases internos para no tener que reescribir todos los loadouts
actuales de golpe:
- `cf_117_badger` -> CF-117 Bulldog Repeater real.
- `cf_227_panther` -> CF-227 Badger Repeater real.
- `cf_337_panther` -> CF-337 Panther Repeater real.
- `laser_cannon_s1/s2/s3` -> M3A/M4A/M5A Cannon reales.
- `laser_repeater_s2` -> CF-227 Badger Repeater real.

Motor:
El banco de armas calcula ahora su origen (`real`, `mixed`, `mock`) y usa datos
reales de capacitor cuando estan disponibles:
- capacidad desde `capacitorAmmo`;
- recarga desde `capacitorRegen`;
- consumo desde `capacitorCostPerShot * RPM`, escalado al modelo interno.

UI:
- Las tarjetas muestran `Armas: datos reales`, `real + fallback` o
  `fallback mock`.
- El resultado muestra el origen en `Banco de armas`.

Verificacion:
- `npm run sync:sc-data` genero 180 entradas de armas.
- `npm run build` correcto.
- Prueba Gladius vs Arrow:
  - ambos usan `source: real`;
  - Gladius: banco 190, recarga 36/s, consumo 62/s;
  - Arrow: banco 150, recarga 31.8/s, consumo 45/s.
- Visualizador recargado; se confirmo que aparecen `Armas: datos reales`,
  `Banco de armas` y `Capacitor medio`.

Riesgos / siguientes pasos:
- El motor sigue usando `ship.dps` manual para dano; los datos reales de armas
  ya estan disponibles, pero aun no alimentan directamente el dano para evitar
  un salto brusco de balance.
- Algunas naves aun tienen mezcla real/mock cuando el loadout usa un arma
  generica que no esta mapeada.
- Siguiente paso recomendado: calibrar una escala de dano real para pasar de
  `ship.dps` manual a DPS derivado del loadout.

### 2026-05-11 - Capacitor derivado de armas equipadas

Objetivo:
Corregir el modelo de capacitor/cargador para que dependa de las armas de la
nave, no de sus escudos. El usuario aporto una referencia visual con columnas
tipo `Ammo`, `Burst DPS`, `Alpha`, `RPM`, `Range`, `Spread`, `Power` y `EM Max`.

Archivos tocados:
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `src/index.css`
- `AI_CHANGELOG.md`

Decision:
Se anadio un catalogo mock de armas dentro de `ships.js` para mantener el dato
en la capa de datos del proyecto. Cada nave tiene ahora `weaponLoadout`, y desde
esa carga se calcula `weaponBank`:
- capacidad del banco de armas;
- recarga por segundo;
- consumo por segundo;
- numero de armas;
- rango medio ponderado;
- EM/power draw aproximados.

El motor ya no deriva la capacidad del capacitor desde `shieldMax` o
`shieldRegen`. `combatEngine.js` lee `ship.weaponBank` y solo aplica la
eficiencia del piloto sobre el uso del banco de armas:
- el piloto no agranda el cargador/capacitor;
- el piloto experto consume de forma mas disciplinada;
- la nave espera una reserva minima antes de reabrir fuego.

UI:
- Las tarjetas de nave muestran `Cap. armas`, `Consumo/s` y `Recarga/s`.
- El panel de resultados muestra `Banco de armas` por nave con capacidad,
  recarga y consumo.

Verificacion:
- `npm run build` correcto.
- Prueba de datos:
  - Gladius: banco 104, recarga 16.5/s, consumo 35.8/s.
  - Arrow: banco 75, recarga 17.1/s, consumo 22.6/s.
  - Buccaneer: banco 190, recarga 15.7/s, consumo 53.6/s.
- Prueba de simulacion Gladius vs Arrow correcta, con estadisticas de banco de
  armas en `stats`.
- Visualizador recargado; se confirmo que aparecen `Cap. armas`, `Consumo/s`,
  `Recarga/s`, `Banco de armas` y `Capacitor medio`.

### 2026-05-11 - Capacitor de armas y ventanas de fuego

Objetivo:
Modelar el capacitor de armas para que una nave no pueda disparar de forma
continua solo por tener solucion de tiro. En Star Citizen el combate ocurre en
rafagas: disparar drena capacitor y las pausas permiten regenerarlo.

Archivos tocados:
- `src/engine/combatEngine.js`
- `src/hooks/useSimulator.js`
- `src/components/ResultsPanel.jsx`
- `src/components/MultiSummaryPanel.jsx`
- `AI_CHANGELOG.md`

Decision:
Se anadio un perfil de capacitor por nave derivado de sus stats:
- capacidad (`capacity`);
- regeneracion por segundo (`regenPerSec`);
- drenaje por segundo al disparar (`drainPerSec`);
- reserva minima para reabrir fuego (`resumeAt`).

El modelo usa histeresis:
- si la nave tiene solucion de tiro y capacitor suficiente, dispara y consume
  capacitor;
- si agota capacitor, entra en espera (`capHold`);
- no vuelve a disparar hasta recuperar una reserva minima;
- mientras no dispara, regenera capacitor.

La habilidad del piloto modifica eficiencia/disciplinia:
- pilotos expertos desperdician menos capacitor;
- tambien tienden a buscar mejores ventanas de tiro, por el modelo de tracking
  ya existente.

Nuevas metricas en `stats`:
- `fireTimeSec`;
- `fireUptimePct`;
- `weaponCapPct`;
- `avgWeaponCapPct`;
- `capStarvedPct`.

UI:
- Resultado individual por nave:
  - `Ventana de fuego`;
  - `Capacitor medio`.
- Resumen multiple por nave:
  - `Ventana de fuego media`;
  - subtitulo con capacitor medio.

Verificacion:
- `npm run build` correcto.
- Prueba Gladius vs Arrow skill 5:
  - fuego activo aprox 43-46%;
  - aparecen pausas por capacitor.
- Prueba skill 10 vs skill 0:
  - el experto mantiene mejor DPS por acierto/tracking;
  - ambos muestran ventanas de fuego y estado de capacitor.
- Visualizador recargado; se confirmaron `Ventana de fuego media`,
  `Ventana de fuego` y `Capacitor medio`.

### 2026-05-11 - Cabecera para simulacion seleccionada

Objetivo:
Separar visualmente el resumen global de simulaciones multiples de los datos de
la simulacion concreta que se esta inspeccionando.

Archivos tocados:
- `src/App.jsx`
- `src/index.css`
- `AI_CHANGELOG.md`

Decision:
Cuando `isMulti` esta activo, se renderiza una cabecera entre
`MultiSummaryPanel` y `ResultsPanel`:

- etiqueta: `Simulacion seleccionada`;
- titulo: `Simulacion #N`;
- enfrentamiento: `Nave A vs Nave B`;
- chips de contexto: ganador, duracion y distancia inicial.

Impacto:
La pantalla queda dividida en tres lecturas:
1. resumen global de todas las runs;
2. cabecera de la run seleccionada;
3. datos especificos de esa run.

Verificacion:
- `npm run build` correcto.
- En el visualizador se confirmo que aparece `Simulacion seleccionada` y
  `Simulacion #1` debajo del resumen global.

### 2026-05-11 - Datos de resultado separados por nave

Objetivo:
Mejorar la UX de las tarjetas de datos. El formato anterior mezclaba datos de
Alfa y Beta en la misma card usando `A / B`, lo que hacia mas dificil entender a
que nave pertenecia cada valor.

Archivos tocados:
- `src/components/ResultsPanel.jsx`
- `src/components/MultiSummaryPanel.jsx`
- `src/index.css`
- `AI_CHANGELOG.md`

Decision:
Las metricas globales del combate quedan arriba:
- duracion;
- distancia inicial;
- merges;
- empates/duracion/balance/total en resumen multiple.

Las metricas que pertenecen a una nave se muestran en dos columnas claras:
- columna Alfa;
- columna Beta.

Resultado individual:
- deteccion;
- DPS efectivo;
- disparos;
- impactos;
- casco restante.

Resumen multiple:
- victorias;
- casco medio restante;
- DPS efectivo medio.

Los graficos no se tocaron.

Verificacion:
- `npm run build` correcto.
- En el visualizador se confirmo que el resumen multiple y el resultado
  individual muestran bloques separados para Gladius y Arrow.

### 2026-05-11 - Historial multiple como rail izquierdo de pantalla

Objetivo:
Dar mas espacio a graficas e informacion cuando hay simulaciones multiples,
moviendo el menu de historial fuera del flujo de la seccion de resultados.

Archivos tocados:
- `src/App.jsx`
- `src/index.css`
- `AI_CHANGELOG.md`

Decision:
Cuando `isMulti` esta activo, `App` anade la clase `has-run-history`.
En escritorio (`min-width: 960px`):
- `.runs-sidebar` pasa a `position: fixed`;
- queda anclado a la izquierda de la pantalla completa;
- el contenido principal se desplaza a la derecha y recupera el ancho de la
  seccion para graficas, metricas y logs.

En pantallas estrechas (`max-width: 959px`) el historial vuelve a integrarse en
el flujo normal para no tapar la app.

Verificacion:
- `npm run build` correcto.
- Se probo temporalmente viewport de escritorio `1280x900`: el historial quedo
  fijo a la izquierda de la pantalla y el contenido principal uso el espacio
  restante. Luego se restauro el viewport normal.

### 2026-05-11 - Casco restante como metrica principal de supervivencia

Objetivo:
Priorizar visualmente el estado del casco sobre `HP+escudo`, porque el casco es
lo que indica cuanto le queda a una nave antes de ser destruida.

Archivos tocados:
- `src/components/ResultsPanel.jsx`
- `src/components/MultiSummaryPanel.jsx`
- `AI_CHANGELOG.md`

Decision:
Se mantiene el calculo de `totalHpPct` porque sigue siendo util como contexto,
pero la UI muestra primero el casco:

- Resultado individual: `Casco restante`.
- Resumen multiple: `Casco medio restante`.
- Subtitulo: `Hasta destruccion · HP+escudo: A% / B%`.

Impacto:
La lectura principal ahora responde a: "la nave se quedo a X% de ser destruida".
El valor de escudo queda como contexto tactico secundario.

### 2026-05-11 - Corregido HP medio en simulaciones multiples

Problema:
La tarjeta `HP medio restante` del resumen multiple promediaba solo `hullPct`
(casco). Eso era matematicamente correcto para casco, pero el nombre era
enganoso y podia dar una lectura equivocada: una nave con casco alto pero escudo
a cero aparecia con mucho "HP" restante.

Archivos tocados:
- `src/engine/combatEngine.js`
- `src/hooks/useSimulator.js`
- `src/components/MultiSummaryPanel.jsx`
- `src/components/ResultsPanel.jsx`
- `AI_CHANGELOG.md`

Decision:
El motor ahora expone:
- `shieldPct`;
- `totalHpPct = (casco restante + escudo restante) / (casco max + escudo max)`.

El resumen multiple calcula:
- `avgTotalHpPctA/B` como media de `totalHpPct` de todas las runs;
- conserva `avgHullPctA/B` como dato secundario.

UI:
- En resumen multiple la tarjeta pasa a `HP+escudo medio`.
- El subtitulo muestra `Casco: A% / B%`.
- En resultado individual la tarjeta pasa a `HP+escudo restante`, tambien con
  casco en el subtitulo.

Verificacion:
- Prueba independiente con 10 runs comparo el promedio manual de
  `(hullRemaining + shieldRemaining) / (hullMax + shieldMax)` contra
  `stats.totalHpPct`.
- Caso detectado: antes se habria mostrado casco medio `54%`, pero el HP total
  real era aprox `26%` porque el escudo estaba a cero.
- `npm run build` correcto.

### 2026-05-11 - Eliminado slider de rango de deteccion base

Objetivo:
Quitar el parametro manual de `Rango de deteccion (base)` de la UI porque, tras
refinar sensores y firmas, la deteccion debe depender de cada nave y no de un
valor que el usuario ajuste a mano.

Archivos tocados:
- `src/hooks/useSimulator.js`
- `src/components/SimControls.jsx`
- `AI_CHANGELOG.md`

Decision:
El motor conserva `DETECTION_RANGE_DEFAULT_M = 20000` como constante interna de
calibracion del modelo, pero el usuario ya no la configura. El hook deja de
guardar `detectionRangeKm`, deja de clamplearlo y llama a `runSimulation()` sin
pasar `detectionRangeM`, permitiendo que el motor use su calibracion interna.

Impacto:
- La UI queda mas coherente: el usuario configura la distancia inicial, naves y
  pilotos; la deteccion sale de radar, firma EM, firma IR, tamano y habilidad.
- La metrica `Deteccion` en resultados sigue mostrando el rango efectivo de cada
  nave contra la otra.

Verificacion:
- `rg` confirmo que no quedan referencias a `detectionRangeKm`,
  `clampDetectionM` ni al texto del slider en `src/`.
- `npm run build` correcto.

### 2026-05-11 - Distancia inicial a 40 km y deteccion por radar/firma

Objetivo:
Permitir combates con distancia inicial de hasta 40 km y refinar la deteccion
para que cada nave detecte segun sus sensores y la firma del objetivo, no con un
rango plano.

Archivos tocados:
- `src/hooks/useSimulator.js`
- `src/components/SimControls.jsx`
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `src/data/ships.js`
- `src/engine/combatEngine.js`

Decision:
La distancia inicial maxima paso de 4 km a 40 km:
- `clampRangeM()` ahora acepta hasta `40000` m;
- el slider de distancia inicial llega a `40.0 km`.

La deteccion ahora compara:
- radar/sensores de la nave atacante (`radarStrength`);
- firma electromagnetica del objetivo (`sigEM`);
- firma termica/calor del objetivo (`sigIR`);
- firma por tamano/seccion transversal (`sigCS`);
- habilidad del piloto como modificador de deteccion/reaccion.

En `src/data/ships.js` se derivan defaults de sensores y firmas a partir de los
datos disponibles de la nave:
- EM: DPS, escudos y regeneracion;
- IR: velocidad SCM/boost, DPS y calor de sistemas;
- CS: tamano, casco, escudos y evasion;
- stealth/ghost/QI reducen firma EM/IR y CS;
- roles como Recon/Bounty/Interceptor mejoran radar.

Correccion importante:
Antes la formula dividia por la firma del objetivo, haciendo que una firma grande
fuera mas dificil de detectar. Ahora la firma aumenta el rango efectivo:
`range = base * radar * skill * sqrt(signatureScore)`.

Para que 40 km sean jugables, el motor anadio una fase de aproximacion rapida a
larga distancia:
- por encima de 5 km usa velocidad de aproximacion derivada del boost de ambas
  naves;
- por debajo de 5 km vuelve al cierre fino de combate (`RANGE_CLOSING_MPS`).

UI:
- `ShipCard` muestra `Radar` y `Firma`.
- `ResultsPanel` muestra una metrica `Deteccion` con los rangos Alfa/Beta.
- El log de eventos sigue mostrando quien detecta antes por tiempo real.

Verificacion:
- `npm run build` correcto.
- Gladius vs Arrow a 40 km:
  - Arrow detecta antes al Gladius por mayor firma del Gladius;
  - rangos aprox: Alfa 17.4 km / Beta 18.6 km.
- Hornet Tracker vs Arrow a 40 km:
  - Tracker detecta antes por mejor radar;
  - rangos aprox: Alfa 20.4 km / Beta 18.2 km.
- Hornet Ghost reduce su firma y es detectado mas tarde por el Gladius.
- Visualizador recargado; se confirmaron `Radar`, `Firma` y metrica `Deteccion`.

### 2026-05-11 - Tracking / time-on-target antes de disparar

Objetivo:
Acercar la simulacion a combates reales de Star Citizen: estar dentro del rango
de armas no significa que el piloto pueda mantener fuego efectivo cada tick. Lo
importante es sostener solucion de tiro sobre un objetivo que maniobra.

Archivos tocados:
- `src/engine/combatEngine.js`

Decision:
Se anadio un modelo de tracking previo al disparo:

- Primero se calcula si la nave esta en la envolvente de fuego (`fireRange`).
- Luego se calcula `trackingQuality()`, que depende de:
  - habilidad del piloto;
  - precision/evasion de la nave atacante como proxy de manejo;
  - evasion de la nave defensora;
  - factor de rango;
  - ventana de merge;
  - jitter aleatorio, mayor en pilotos novatos.
- El piloto solo dispara si supera `triggerThresholdForPilot()`.
- Los pilotos novatos disparan con soluciones mas pobres; los expertos esperan
  mejor solucion pero la consiguen de forma mas estable.
- `trackingHitFactor()` modifica la probabilidad de impacto de los disparos que
  si llegan a hacerse.

Impacto esperado:
- Menos disparos "gratuitos" por estar apenas dentro del rango.
- El novato puede disparar antes, pero con peor time-on-target y menos impactos.
- Las metricas ya existentes de `Disparos`, `Impactos` y `% acierto` muestran el
  efecto sin anadir UI nueva.

Verificacion:
- `npm run build` correcto.
- Caso Gladius skill 10 vs Arrow skill 0:
  - Alfa gana;
  - Alfa: 136 disparos, 95 impactos, 70%;
  - Beta: 74 disparos, 16 impactos, 22%.
- Prueba de simetria con 50 semillas:
  - experto en Alfa gana 50/50;
  - experto en Beta gana 50/50.
- Caso skill 5 vs skill 5 mantiene ventaja para Gladius por stats de nave, no
  por sesgo de lado.

### 2026-05-11 - Disparos e impactos agregados a la UI

Objetivo:
Mostrar en la interfaz la cantidad total de disparos y la cantidad total de
impactos por nave.

Archivos tocados:
- `src/engine/combatEngine.js`
- `src/components/ResultsPanel.jsx`

Decision:
Los totales se calculan dentro del motor como parte de `stats`, no desde el
componente. Esto mantiene la UI como capa de presentacion.

Campos nuevos en `stats`:
- `shotsFired`
- `hits`
- `hitPct`

UI:
- `ResultsPanel` muestra dos metricas nuevas:
  - `Disparos`: Alfa / Beta
  - `Impactos`: Alfa / Beta, con porcentaje de acierto debajo

Verificacion:
- `npm run build` correcto.
- Simulacion directa del motor devolvio valores coherentes:
  - ejemplo: Gladius skill 10 vs Arrow skill 0 -> Alfa 136 disparos, 95 impactos,
    70%; Beta 164 disparos, 50 impactos, 30%.
- En el visualizador se confirmo que aparecen `Disparos` e `Impactos`.

### 2026-05-11 - Correccion de rango optimo vs rango de disparo

Problema:
El motor usaba el rango optimo (`rOpt`) como si fuera el rango maximo para poder
disparar. Eso hacia que un piloto experto con rango optimo de 600 m casi no
disparase si el combate no se mantenia por debajo de 600 m. En la practica, un
novato ganaba porque disparaba antes aunque fuera peor.

Archivos tocados:
- `src/engine/combatEngine.js`

Decision:
Separar dos conceptos:

- `rangeOptForPilot()`: rango optimo para maximizar impactos.
  - skill 10 -> 600 m
  - skill 0 -> 1000 m
- `fireRangeForPilot()`: rango maximo al que el piloto decide abrir fuego.
  - skill 10 -> hasta 1000 m
  - skill 0 -> hasta 1400 m

La precision y la varianza siguen penalizando disparar lejos del rango optimo.
El piloto experto puede disparar fuera de 600 m, pero sigue queriendo llevar el
combate a su distancia ideal.

Tambien se ajusto el control de distancia post-merge:
- antes podia favorecer accidentalmente a Alfa por el signo del control;
- ahora `engagementTargetRange()` pondera el rango objetivo segun la habilidad y
  estado de consciencia/reaccion de ambos pilotos.

Verificacion:
- Caso problematico: Gladius skill 10 vs Arrow skill 0.
- Antes: el experto podia quedarse practicamente sin disparar.
- Despues: el experto dispara de forma sostenida y gana por mejor precision y
  posicionamiento.
- Prueba de simetria con 50 semillas:
  - experto en Alfa gana las 50;
  - experto en Beta gana las 50.
- `npm run build` correcto.

### 2026-05-11 - Rango de deteccion base a 20 km

Objetivo:
Cambiar el parametro de rango de deteccion base a 20 km.

Archivos tocados:
- `src/hooks/useSimulator.js`
- `src/components/SimControls.jsx`
- `src/engine/combatEngine.js`

Decision:
El cambio se hizo de extremo a extremo:
- configuracion por defecto: `detectionRangeKm: 20.0`;
- control de UI: maximo 20 km;
- clamp interno: maximo 20000 m;
- valor por defecto del motor: `DETECTION_RANGE_DEFAULT_M = 20000`.

Verificacion:
- `npm run build` correcto.
- El visualizador mostro `20.0 km` en `Rango de deteccion (base)`.

## Notas para futuros modelos

- Si `AGENTS.md` o `CLAUDE.md` contienen formulas antiguas, este historial
  refleja los cambios mas recientes.
- No mover logica de combate a componentes React.
- Si se anaden metricas nuevas del combate, preferir calcularlas en
  `combatEngine.js` y pasarlas por `stats`, `series`, `events` o `shots`.
- Los cambios en `dist/` son artefactos de build. No interpretarlos como fuente
  principal de logica.
- Hay avisos conocidos al compilar:
  - warning de chunk grande por bundle de Recharts;
  - warning de Node sobre `MODULE_TYPELESS_PACKAGE_JSON` al ejecutar pruebas
    directas con `node --input-type=module`.
