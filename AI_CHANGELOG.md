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
