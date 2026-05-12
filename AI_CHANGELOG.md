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
- La evasion real de una nave pondera giro, roll, boost, aceleracion, movimiento
  lateral/vertical derivado, masa, volumen, firma y resistencia total.
- El catalogo real de armas se genera desde Star Citizen Wiki API e incluye
  penetracion real para la mayoria de armas importadas.
- La penetracion usa `thickness`, `baseDistance`, `nearRadius` y `farRadius`
  para calcular sangrado de escudo y bypass de armor.
- Las naves pueden resolverse con variantes de loadout: stock, gatlings
  balisticas, canones balisticos y repetidores balisticos cuando sus hardpoints
  lo permiten.
- Los parametros principales de nave ya se importan desde Star Citizen Wiki API:
  casco, escudos, regeneracion, velocidades, firmas, armor, hardpoints y stock
  weaponry.
- El blindaje se normaliza como mitigacion de casco (`armorReductionPct`) y se
  muestra en la tarjeta de cada nave.
- La planta de energia modifica el sostenimiento del capacitor de armas:
  capacidad, recarga y consumo efectivo.
- El capacitor de armas usa `capacitorAmmo` como unidad de disparos disponibles
  para armas de energia; el coste bruto de la API no se mezcla con esa escala.
- Cada bando tiene un configurador propio de armas y componentes compatibles
  con la nave seleccionada.
- Las armas se configuran por espacio individual de arma, no por grupo de
  hardpoints del mismo tamano.
- El catalogo real de componentes se genera desde Star Citizen Wiki API e
  incluye escudos, plantas de energia, coolers y radares.

## Historial

### 2026-05-12 - La habilidad del piloto pesa mas contra blancos grandes

Objetivo:
Corregir un sesgo del modelo dinamico: una Arrow o Gladius con piloto muy
superior (`skill 8-10`) seguia sin poder cerrar el combate contra una Guardian
con piloto medio (`skill 5`), incluso cuando la diferencia de pilotaje ya le
permitia sobrevivir y romper escudos.

Archivos tocados:
- `src/engine/combatEngine.js`

Decision:
Se refuerza el impacto ofensivo de la habilidad en dos puntos:

1. `weaponTrackingVsTargetFactor()` ahora tambien considera la habilidad del
   atacante. Un piloto bueno aprovecha mejor armas rapidas y consistentes,
   especialmente cuando el blanco es grande y poco agil.

2. `directVitalHitShare()` gana una dependencia mas fuerte de:
   - ventaja de skill atacante vs defensor;
   - tamano del `Body`;
   - estabilidad/agilidad real del blanco.

Esto hace que un piloto muy bueno no solo esquive mejor, sino que convierta una
mayor parte de su dano de casco en castigo real al componente vital cuando pelea
contra una nave mas torpe y con un `Body` grande.

Verificacion:
- Arrow vs Guardian, 3 min, seed `42`:
  - `5 vs 5`: Guardian gana por tiempo; Arrow termina tocada y la Guardian con
    `71%` de `Body`.
  - `8 vs 5`: Arrow destruye a la Guardian en `160.3s`.
  - `9 vs 5`: Arrow destruye a la Guardian en `130.1s`.
  - `10 vs 5`: Arrow destruye a la Guardian en `110.6s`.
- Gladius vs Guardian, 3 min, seed `42`:
  - `8 vs 5`: Gladius destruye a la Guardian en `147.2s`.
- Arrow vs Gladius se mantiene razonable:
  - `5 vs 5` sigue sin destruccion asegurada en 3 min;
  - `8 vs 5` ya resuelve a favor de la Arrow en `135.7s`.

Riesgos / siguientes pasos:
- El ajuste refuerza bastante el castigo al `Body` de naves grandes con baja
  maniobrabilidad. Conviene observar si el salto entre `7` y `8` queda demasiado
  brusco en otros matchups.
- El siguiente refinamiento natural es convertir parte de esta ventaja de skill
  en mejor control posicional/rango, para que no todo el peso extra recaiga en
  la punteria al componente vital.

### 2026-05-12 - Recalibracion del dano interno con modo estatico

Objetivo:
Corregir un desfase importante detectado en el banco de pruebas estatico:
una Gladius no lograba destruir a una Guardian ni tras 10 minutos de impactos
perfectos y continuos, lo que indicaba que el motor estaba atenuando demasiado
el dano base de las armas reales.

Archivos tocados:
- `src/data/weapons.js`
- `src/data/ships.js`
- `src/engine/combatEngine.js`

Decision:
Se separan dos escalas que antes estaban mezcladas:
- `WEAPON_DPS_TO_SIM_SCALE = 0.14` se conserva para heuristicas y referencias
  resumidas de nave;
- `WEAPON_DAMAGE_TO_SIM_SCALE = 0.26` pasa a gobernar el dano real que usan
  `simAlpha` y `simBurstDps` dentro del motor.

Ademas, la metrica `theoreticalDps` deja de depender de `ship.dps` y pasa a
salir directamente de la suma de `simBurstDps` de los grupos de armas activos,
para que la UI no muestre un teorico desalineado con la simulacion.

Tras revisar la logica de destruccion, el motor deja de asumir que todo el
`hullHp` agregado es "zona de muerte". Cuando hay dato fiable o verificado, se
usa el `Body` de la nave como componente vital real; mientras tanto se mantiene
un fallback derivado para no bloquear el resto del catalogo.

Verificacion:
- Antes del cambio, Gladius -> Guardian, modo estatico, 600 m, solo Alfa:
  - tras 10 min la Guardian seguia con `35270 HP` de casco (`51%`).
- Despues del cambio:
  - Gladius -> Guardian, mismo escenario: destruccion completa antes del limite;
  - Arrow vs Gladius, 3 min, skill 5 vs 5, seed 42:
    - el combate ya entra en ventana de destruccion alrededor de `2.4-2.5 min`,
      mas cerca del comportamiento esperado por experiencia de juego.

Riesgos / siguientes pasos:
- La letalidad ya esta mucho mejor alineada en estatico, pero conviene seguir
  observando combates dinamicos para no pasarnos en naves grandes con burst muy
  alto.
- El siguiente refinamiento natural es revisar si la condicion de destruccion
  deberia apoyarse en un "vital/body HP" cuando esa fuente exista.

### 2026-05-12 - Visualizacion explicita del Body en graficas

Objetivo:
Hacer visible que la destruccion ya depende del `Body` y no solo del casco
agregado, porque la grafica de casco + escudos podia llevar a pensar que una
nave seguia necesitando perder todo su `hullHp` total para morir.

Archivos tocados:
- `src/engine/combatEngine.js`
- `src/components/Charts.jsx`

Decision:
Se anaden snapshots por segundo del `Body` restante de cada nave (`aVital`,
`bVital`) y una grafica nueva `Body en el tiempo`.
Ademas, la grafica anterior se renombra a `Casco agregado + escudos` para
distinguirla del componente vital.

Verificacion:
- El resultado expone ahora una serie temporal especifica para el `Body`.
- La nueva grafica permite comprobar visualmente que cuando el `Body` llega a
  `0`, la nave es destruida.

### 2026-05-12 - Impacto directo al Body dependiente de skill y tamano

Objetivo:
Corregir un comportamiento irreal detectado en la nueva grafica del `Body`: en
Guardian, el `Body` no empezaba a bajar hasta que el casco agregado quedaba
reducido a ese mismo valor, como si todos los impactos hull fueran primero a
componentes no vitales.

Archivos tocados:
- `src/engine/combatEngine.js`

Decision:
Se corrige el calculo de impacto directo al `Body` y se hace depender de:
- habilidad del atacante;
- exposicion base del `Body`;
- tamano absoluto del `Body`;
- penetracion efectiva del arma.

Con ello:
- pilotos mas habilidosos convierten una mayor fraccion del dano de casco en
  dano directo al `Body`;
- naves con `Body` mas grande reciben impactos directos con algo mas de
  frecuencia;
- un piloto intermedio (`skill 5`) ya no se comporta como un tirador perfecto.

Verificacion:
- Antes del ajuste, Gladius -> Guardian estatico:
  - el `Body` no bajaba hasta ~`519s`;
  - `vitalDmgDealt` seguia en `0` hasta vaciar casi todo el casco no vital.
- Despues del ajuste:
  - el `Body` empieza a bajar desde el primer segundo registrado;
  - Gladius -> Guardian estatico destruye en `303.2s`, en lugar de `590.4s`;
  - Arrow vs Gladius dinamico, skill `5 vs 5`, seed `42`:
    - sigue resolviendose en `146s`;
  - Arrow vs Gladius dinamico, skill `2 vs 2`, seed `42`:
    - ya no destruye en 3 min y ambos conservan bastante mas `Body`.

### 2026-05-12 - Tracking convertido en modulador de ventana de fuego

Objetivo:
Revisar por que el combate dinamico Arrow vs Gladius era demasiado poco letal
aunque el modo estatico demostraba que el dano base si podia destruir una nave
en torno a 100-120 segundos.

Archivos tocados:
- `src/engine/combatEngine.js`

Decision:
El problema principal no era el cierre inicial ni el capacitor. El bloqueo venia
de usar el tracking como puerta binaria:
- si `tracking < threshold`, la nave no disparaba nada ese tick.

Eso hacia que pilotos de nivel medio pasaran demasiado tiempo sin aprovechar la
ventana de tiro, especialmente contra naves evasivas.

Se cambia el modelo:
- el tracking ya no decide `dispara / no dispara`;
- ahora modula cuanta parte de la ventana de fuego convierte el piloto en fuego
  real (`firingWindowFactor`);
- el nivel del piloto sigue importando incluso si ambos tienen el mismo skill:
  un piloto 5 no capitaliza la ventana como uno 10;
- en modo estatico este factor se fuerza a `1`.

Tambien se anade un control por alcance real de cada grupo de armas dentro de
`resolveWeaponFire()`.

Verificacion:
- Antes del cambio, Arrow vs Gladius, 3 min, skill 5 vs 5, seed 42:
  - Arrow `37%` de uptime;
  - Gladius `10%` de uptime;
  - resultado final: `99%` y `96%` de casco.
- Despues del cambio:
  - ambos suben a ~`95%` de uptime;
  - Arrow queda en torno a `64-67%` de casco;
  - Gladius queda en torno a `94%` de casco y `5-8%` de escudo en seeds 42-46.
- Escala de skill verificada:
  - skill 2: menos dano y menos uptime que skill 5;
  - skill 10: mas dano que skill 5, no se comporta igual.

Resultado:
El cuello principal de letalidad ya no es el gate binario de tracking.
El siguiente cuello visible pasa a ser la letalidad por impacto del modelo
dinamico: precision real, mitigacion y conversion de DPS a dano efectivo.

### 2026-05-12 - Nuevo modo de combate estático para depuración

Objetivo:
Crear un modo de prueba sin maniobra ni fallo para aislar si los problemas de
realismo vienen de tracking, rangos, detección o del modelo base de daño,
escudos, capacitor y casco.

Archivos tocados:
- `src/components/SimControls.jsx`
- `src/hooks/useSimulator.js`
- `src/engine/combatEngine.js`
- `src/components/ResultsPanel.jsx`

Decision:
Se elimina de la UI el botón `Hasta la muerte` y se sustituye por
`Combate estático`.

En este modo:
- las naves quedan frente a frente a distancia fija;
- no hay detección, cierre, merge ni maniobra;
- no hay jitter ni fallos: si un arma puede disparar, impacta;
- la duración usa el mismo control temporal que `Duración fija`;
- se puede elegir quién dispara con dos checks:
  - Alfa;
  - Beta;
  - ambos checks activos = ambos disparan.

Además:
- las simulaciones múltiples y el rango aleatorio se ignoran en este modo;
- cada grupo de armas respeta ahora su `rangeM` real antes de disparar;
- el panel de resultados cambia `Merges` por una etiqueta de prueba estática y
  reemplaza `Detección` por `Posición`.

Verificacion:
- UI validada con:
  - pestaña `Combate estático`;
  - bloque `Banco de pruebas estático`;
  - checks `Dispara Alfa` y `Dispara Beta`.
- Arrow vs Gladius, estático, 800 m:
  - ambos disparan: victoria Gladius en `101.9s`;
  - solo dispara Alfa: victoria Arrow en `123.1s`;
  - solo dispara Beta: victoria Gladius en `101.9s`.
- Arrow vs Gladius, modo normal, 3 min, seed 42:
  - sigue siendo poco realista: termina el tiempo con `99%` y `96%` de casco.

Resultado:
El nuevo modo deja claro que el problema fuerte de realismo no está en el daño
base puro, sino en la lógica del combate dinámico.

### 2026-05-12 - Blindaje de UI cambiado a casco efectivo

Objetivo:
Corregir una confusion en la ficha de nave: Arrow y Gladius mostraban el mismo
`HP blindaje`, lo que llevaba a interpretar que ambas tenian el mismo blindaje.

Archivos tocados:
- `src/data/ships.js`
- `src/components/ShipCard.jsx`
- `AI_CHANGELOG.md`

Decision:
La fuente real (`Star Citizen Wiki API`) expone `armor.health`, pero ese valor
se repite entre varias naves pequenas y no sirve bien como comparativa visual
de blindaje entre cascos distintos.

La ficha deja de tratar ese valor como `HP blindaje` principal y pasa a mostrar
`Casco efectivo`, derivado de:
- `hullHp / damageMultiplier.physical`
- `hullHp / damageMultiplier.energy`

Se mantiene el `armor.health` original solo como referencia secundaria de la
API dentro de la fila.

Verificacion:
- Arrow:
  - `armor.health` API: `4125`
  - casco efectivo: `11440` fisico / `14300` energia
- Gladius:
  - `armor.health` API: `4125`
  - casco efectivo: `8147` fisico / `10183` energia

Resultado:
La UI ya no sugiere erroneamente que Arrow y Gladius tienen el mismo blindaje
real en combate.

### 2026-05-12 - Panel de combate alineado con metricas tipo SPViewer

Objetivo:
Sustituir la ficha antigua de cada nave por un panel centrado en metricas de
combate equivalentes a las que el usuario espera ver en referencias tipo
SPViewer, dejando fuera ruido como combustible o carga.

Archivos tocados:
- `src/components/ShipCard.jsx`
- `src/data/ships.js`
- `src/index.css`
- `AI_CHANGELOG.md`

Decision:
La ficha ahora se organiza en seis bloques:
- Casco;
- Armamento;
- Blindaje;
- Vuelo;
- Aceleraciones;
- Calculo.

Se muestran como datos principales:
- dimensiones, masa y HP total;
- Pilot DPS sostenido/burst, alpha, misiles, escudo y municion balistica;
- HP de blindaje, modificadores de dano, durabilidad, firma, deflexion y
  resistencia de penetracion disponible en la fuente actual;
- SCM, NAV, boost, pitch/yaw/roll y valores boosted;
- aceleraciones en G derivadas desde datos reales de maniobra cuando la fuente
  no trae ese bloque directamente;
- metricas propias del simulador: precision, evasion y maniobrabilidad.

Fuentes y criterio:
- casco, blindaje, escudos, firmas, masas, velocidades y weaponry base salen de
  Star Citizen Wiki API cuando existen;
- el DPS sostenido de armas se toma de `fixedWeapons.sustainedDps` del catalogo
  real cuando hay coincidencia;
- las aceleraciones `Main/Retro/Up/Down/Strafe` son una estimacion derivada de
  `boostForward`, `boostBackward`, `zeroToScm`, `pitchBoosted`, `yawBoosted` y
  scores de thrusters, porque la fuente actual no expone el bloque exacto en G;
- la UI marca ahora `real + estimado` cuando una ficha mezcla datos reales con
  metricas derivadas.

Verificacion:
- Gladius:
  - `Pilot DPS 956 sust. / 1598 burst`;
  - `Armor HP 4125`;
  - `Damage Modifiers -25 / -40 / 0`;
  - aceleraciones estimadas `13.6 / 4.1 / 10 / 5 / 10 G` base.
- Guardian:
  - `Pilot DPS 1858 sust. / 3073 burst`;
  - `Armor HP 11250`;
  - `SCM 213`, `Boost 465`;
  - aceleraciones estimadas claramente por debajo de Gladius.
- `npm run build` correcto.

Riesgos / siguientes pasos:
- El bloque de aceleraciones sigue siendo derivado, no nativo.
- Hay diferencias entre esta fuente y algunas capturas externas de SPViewer;
  antes de recalibrar la simulacion contra esos valores conviene confirmar la
  fuente exacta de referencia o integrar esa fuente directamente.

### 2026-05-12 - Boost y thrusters en evasion y ventana de disparo

Objetivo:
Incluir el boost de velocidad y la capacidad de movimiento lateral/vertical en
el calculo de evasion y en la ventana de oportunidad de disparo.

Archivos tocados:
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `AI_CHANGELOG.md`

Decision:
La API de naves no expone un componente de thrusters laterales separado, asi que
se deriva un perfil de maniobra con proxies reales:
- `boostForward`;
- `boostBackward`;
- `zeroToScm`;
- `zeroToMax`;
- `pitchBoosted` como capacidad vertical;
- `yawBoosted` como capacidad horizontal/lateral;
- `rollBoosted`.

Este perfil genera:
- `verticalThrusterScore`;
- `lateralThrusterScore`;
- `strafeThrusterScore`;
- `boostThrusterScore`;
- `thrusterScore`.

Impacto en motor:
- `realEvasion()` usa el perfil de thrusters ademas de masa, volumen y firma.
- `trackingQuality()` usa el control de thrusters del atacante y la presion de
  maniobra del defensor para decidir si hay solucion de tiro.
- En merge, el boost/strafe del defensor estrecha la ventana de disparo si el
  atacante no puede compensarlo.

Verificacion:
- Perfiles resultantes:
  - Arrow: evasion `0.36`, strafe `0.87`, boost `0.80`;
  - Gladius: evasion `0.32`, strafe `0.72`, boost `0.77`;
  - Guardian: evasion `0.14`, strafe `0.30`, boost `0.41`.
- Gladius vs Guardian, 6 minutos, 40 km iniciales, seed 42:
  - Gladius abre fuego antes y sostiene mas ventana de disparo;
  - Guardian baja mucho mas tarde el escudo de Gladius (`180.9s`);
  - Guardian gana por destruccion a los `282.3s`, con escudo muy castigado.

### 2026-05-12 - Recalibracion de evasion por masa e inercia

Objetivo:
Evitar que naves pesadas como la Guardian tengan una evasion demasiado cercana a
cazas ligeros como la Gladius.

Archivos tocados:
- `src/data/ships.js`
- `AI_CHANGELOG.md`

Decision:
La evasion ya no se calcula solo con pitch/yaw, velocidad SCM y firma CS. Ahora
representa mejor la dificultad real de evitar impactos e incluye:
- giro medio pitch/yaw;
- roll;
- aceleracion 0-SCM;
- velocidad SCM;
- masa total;
- volumen aproximado;
- HP total de casco + escudo;
- firma CS.

Impacto:
- Arrow: `0.37`
- Gladius: `0.33`
- Hornet F7C Mk I: `0.23`
- Guardian: `0.14`
- Guardian QI: `0.14`

Verificacion:
- Gladius vs Guardian, 6 minutos, 40 km iniciales, seed 42:
  - la Gladius sube de 51% a 61% de acierto contra Guardian;
  - Guardian conserva su ventaja por escudos/casco/armas, no por esquiva;
  - Guardian destruye la Gladius a los 187.6s.

### 2026-05-12 - Correccion de dano efectivo y capacitor de armas

Objetivo:
Corregir un caso irrealista donde, en combates de varios minutos como Gladius vs
Guardian, las naves no conseguian bajar escudos porque el capacitor de armas
limitaba demasiado la cadencia real.

Archivos tocados:
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `AI_CHANGELOG.md`

Decision:
Las armas de energia reales traen dos magnitudes distintas:
- `capacitorAmmo`: cantidad de disparos que puede sostener el arma;
- `capacitorCostPerShot`: coste bruto interno de la API.

El motor estaba escalando la capacidad con `capacitorAmmo`, pero restaba el
coste bruto por disparo. Eso hacia que armas como el M7A del Guardian vaciaran
practicamente todo el capacitor en una sola salva.

Ahora el coste de disparo se normaliza contra `capacitorAmmo`, y las armas
balisticas quedan fuera del banco de capacitor de energia. Tambien pueden seguir
disparando aunque el capacitor de energia este en espera de recarga.
El dato visible de consumo por segundo se alinea con este consumo normalizado y
ya no aplica un suelo artificial heredado del modelo anterior.

Verificacion:
- Gladius vs Guardian, 6 minutos, 40 km iniciales, seed 42:
  - antes: Guardian no rompia el escudo de Gladius;
  - despues: Guardian rompe el escudo de Gladius a los 140.9s y destruye la
    nave a los 191.9s.
- El Guardian pasa de coste M7A `31.61` por disparo a `1.00` en la escala del
  capacitor simulado.
- La Gladius conserva la Mantis balistica disparando sin depender del capacitor.

### 2026-05-12 - Correccion de recarga de escudos

Objetivo:
Corregir la logica de regeneracion de escudos para que solo recarguen cuando la
nave haya pasado el delay correcto sin recibir dano.

Archivos tocados:
- `src/engine/combatEngine.js`
- `src/data/ships.js`
- `AI_CHANGELOG.md`

Decision:
Se separan dos delays:
- `shieldDamagedDelay`: delay normal tras recibir dano;
- `shieldDownedDelay`: delay mas largo cuando el escudo llega a 0.

El motor reinicia el temporizador de recarga con cualquier dano efectivo
recibido, incluso cuando el escudo ya esta a 0 y el dano entra directamente al
casco. Esto evita que un escudo destruido empiece a recargar bajo fuego
continuo.

Impacto en simulacion:
- dano continuo mantiene el escudo sin regenerar;
- al dejar de recibir dano, el escudo espera el delay correspondiente y luego
  regenera;
- los componentes de escudo reales aportan `damagedDelay` y `downedDelay`
  cuando estan disponibles.

Verificacion:
- `npm run build` correcto.
- Prueba controlada con dano continuo:
  - escudo baja de 50 a 0;
  - permanece a 0 durante todo el fuego continuo;
  - 149 disparos, 573 dano a casco, sin regeneracion indebida.
- Prueba controlada con un solo disparo:
  - escudo baja de 50 a 25;
  - no regenera durante 2s;
  - despues empieza a recuperar: 25, 25, 34, 44, 50.
- Gladius base conserva `shieldDamagedDelay = 5` y `shieldDownedDelay = 10`;
  con FR-66 usa delays reales aproximados `4.8` y `9.6`.

### 2026-05-12 - Planta de energia afecta capacitor de armas

Objetivo:
Hacer que el capacitor de armas no dependa solo del arma equipada, sino tambien
de la planta de energia de la nave.

Archivos tocados:
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `AI_CHANGELOG.md`

Decision:
La API trae `powerPlant.powerOutput` a cero en muchas plantas, asi que se usa
`resource.generation.power` como fuente real de potencia. Para la nave base se
calcula una potencia de referencia por tamano compatible de power plant
usando la mediana de las plantas disponibles; si el usuario equipa una planta
con mas potencia, mejora el sostenimiento del banco de armas, y si equipa una
planta mas baja lo penaliza.

Impacto en simulacion:
- `powerPlantOutput` y `powerPlantBaselineOutput` quedan normalizados en la nave;
- `weaponBank.powerPlantEnergyRatio` compara la planta equipada contra la base;
- una planta mejor sube ligeramente capacidad y recarga, y baja el consumo
  efectivo;
- una planta peor baja capacidad/recarga y sube consumo efectivo;
- el motor exporta estos datos en `stats` para resultados.

UI:
- La ficha de nave muestra `Planta` con la potencia de la power plant.
- `Cap. armas` pasa a `Capacitor` para evitar ambiguedad.
- Resultados muestra el soporte de planta en el bloque `Banco de armas`.
- Nota posterior: la fila de ficha `Planta` se cambio a `Soporte` y muestra un
  multiplicador (`1.00x`, `1.10x`, etc.) en vez del valor bruto de potencia,
  porque no esta en las mismas unidades que `Consumo/s`.

Verificacion:
- `npm run build` correcto.
- Validacion con Gladius:
  - base: potencia 15.5, ratio 1.00x, recarga 30/s;
  - JS-300: potencia 17, ratio 1.10x, recarga 31.8/s;
  - Slipstream: potencia 14, ratio 0.90x, recarga 28.2/s.

### 2026-05-12 - Aclaracion de municion balistica

Objetivo:
Evitar confusion con el dato de municion en las naves. La cifra no representa
municion de todas las armas, sino solo proyectiles finitos de armas balisticas.

Archivos tocados:
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `src/engine/combatEngine.js`
- `AI_CHANGELOG.md`

Decision:
La ficha de nave cambia la etiqueta a `Mun. bal.`. Si no hay armas con municion
finita, muestra `—` en lugar de infinito. En resultados, el dato pasa a
`Munición balística` y el subtitulo aclara cuantos proyectiles quedan, la
capacidad total y cuantas armas balisticas tiene la nave.

Ejemplo:
- Gladius stock: 2 Panther laser sin municion finita + 1 Mantis con 4314
  proyectiles.
- Gladius con Deadbolt III en un slot: 2 Panther laser + 1 Deadbolt III con 387
  proyectiles.

Verificacion:
- `npm run build` correcto.
- Validacion por datos:
  - stock Gladius: `ammoCapacity = 4314`, `ballisticWeaponCount = 1`;
  - Gladius con Deadbolt III: `ammoCapacity = 387`, `ballisticWeaponCount = 1`.

### 2026-05-12 - Blindaje visible en datos de nave

Objetivo:
Aclarar si el blindaje existe en la simulacion y hacerlo visible antes de
ejecutar combates.

Archivos tocados:
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `src/components/ShipCard.jsx`
- `AI_CHANGELOG.md`

Decision:
El blindaje ya se importaba desde Star Citizen Wiki API como `vehicle.armor`
(`health`, `damageMultipliers`, `resistanceMultipliers`, `deflection`) y el
motor ya lo usaba para reducir dano al casco. Se anade ahora una normalizacion
explicita en la capa de datos:
- `armorReduction`;
- `armorReductionPct`;
- `armorPhysicalMultiplier`;
- `armorEnergyMultiplier`;
- deflection fisica/energia.

El motor prioriza `ship.armorReduction` si existe, para que UI y simulacion lean
la misma mitigacion base. La tarjeta de nave muestra una nueva fila `Blindaje`.

Verificacion:
- `npm run build` correcto.
- Validacion por datos:
  - Gladius: blindaje 25%, armor health 4125;
  - Arrow: blindaje 25%, armor health 4125;
  - Hornet F7C: blindaje 25%, armor health 8250.

### 2026-05-12 - Retirada de tarjeta "Armas cargadas"

Objetivo:
Reducir duplicacion visual en las tarjetas de nave. Los selectores de arma ya
muestran el arma base o personalizada de cada slot, por lo que la tarjeta
"Armas cargadas" aportaba la misma informacion dos veces.

Archivos tocados:
- `src/components/ShipCard.jsx`
- `src/index.css`
- `AI_CHANGELOG.md`

Decision:
Se elimina la tarjeta de resumen de armas/componentes dentro de cada `ShipCard`.
La configuracion sigue visible y editable en los selectores por slot, y el
resumen detallado del loadout se mantiene en resultados.

Verificacion:
- `npm run build` correcto.
- Navegador validado: ya no aparece el texto "Armas cargadas".

### 2026-05-12 - Armas configurables por espacio individual

Objetivo:
Permitir que el usuario elija un arma distinta para cada espacio de arma
disponible en la nave. Ejemplo: la Gladius carga por defecto dos Panther y una
Mantis, y ahora se pueden cambiar esos tres espacios de forma independiente.

Archivos tocados:
- `src/data/ships.js`
- `src/hooks/useSimulator.js`
- `src/App.jsx`
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `src/data/components.js`
- `AI_CHANGELOG.md`

Decision:
Se sustituye el modelo de configuracion `weaponsBySize` por `weaponsBySlot`.
La capa de datos expande los hardpoints reales de la nave en slots individuales
(`weapon-1`, `weapon-2`, etc.) y asigna a cada slot el arma base importada desde
el loadout real de la nave cuando esta disponible.

El selector general de loadouts se elimina de la UI. El loadout base queda
cargado por defecto y cada selector muestra directamente el arma o componente
base que hay en ese espacio. Al cambiar un slot, la nave pasa internamente a
`custom` y se recalculan DPS, municion, capacitor, rango y perfil de dano.

UI:
- Gladius muestra tres selectores S3 separados:
  - Arma 1: CF-337 Panther Repeater;
  - Arma 2: CF-337 Panther Repeater;
  - Arma 3: Mantis GT-220 Gatling.
- Los componentes ya no muestran "Stock" como opcion visible; usan el nombre
  inferido del componente base cuando se puede o una etiqueta "base Sx".
- Resultados cambia el bloque "Loadout" por "Armas" y muestra
  "Base de nave" o "Personalizadas".

Verificacion:
- `npm run build` correcto.
- Validacion por datos:
  - Gladius resuelve 3 slots S3 individuales;
  - cambiar solo `weapon-3` a `Deadbolt III Cannon` mantiene las dos Panther y
    recalcula el banco de armas con 3 armas totales.

Riesgos / siguientes pasos:
- La API de naves trae nombres reales de armas base, pero los componentes base
  de algunas naves llegan genericos. Para escudos/radar se infiere el nombre por
  cercania de estadisticas; para plantas/coolers puede seguir apareciendo una
  etiqueta base por tamano hasta tener una fuente mas exacta.

### 2026-05-11 - Configurador de armas y componentes compatibles

Objetivo:
Permitir que cada usuario personalice las armas y componentes de cada nave sin
depender de una URL externa de SP Viewer.

Archivos tocados:
- `scripts/sync-sc-data.mjs`
- `src/data/generated/components.generated.js`
- `src/data/components.js`
- `src/data/ships.js`
- `src/hooks/useSimulator.js`
- `src/App.jsx`
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `src/index.css`
- `src/utils/spviewerUrl.js`
- `AI_CHANGELOG.md`

Decision:
La importacion por URL de SP Viewer se retira de la UI porque la API de
`data.spviewer.eu` permite leer loadouts por `sharedid`, pero su CORS no permite
usar esa importacion directamente desde `localhost`/nuestra app sin backend.

En su lugar se crea un configurador nativo:
- armas filtradas por tamano real de hardpoint de la nave;
- escudos filtrados por tamano de generador admitido;
- plantas de energia filtradas por tamano;
- coolers filtrados por tamano;
- radar filtrado por tamano.

El script `npm run sync:sc-data` ahora genera `components.generated.js` con 309
componentes reales desde Star Citizen Wiki API:
- Shield;
- PowerPlant;
- Cooler;
- Radar.

Impacto en simulacion:
- cambiar armas recalcula DPS, municion, rango, capacitor y perfil de dano;
- cambiar escudos recalcula HP de escudo, regeneracion y cooldown;
- cambiar radar modifica la fuerza de deteccion;
- cambiar plantas/coolers modifica firmas EM/IR usadas por deteccion;
- los resultados muestran si los componentes son stock o personalizados.

UI:
- Se elimina el campo `SP Viewer URL`.
- Se anade `Armas compatibles` por tamano de hardpoint.
- Se anade `Componentes compatibles` por tipo y tamano admitido por la nave.
- El loadout `Personalizado` aparece automaticamente cuando se cambia un arma.

Verificacion:
- `npm run sync:sc-data` correcto:
  - 180 armas;
  - 244 naves;
  - 309 componentes.
- `npm run build` correcto.
- Navegador validado:
  - no aparece `SP Viewer`;
  - aparecen `Armas compatibles` y `Componentes compatibles`;
  - Gladius muestra `3x hardpoint S3` y componentes S1 compatibles;
  - al elegir `Revenant Gatling`, `AllStop` y `Abetti`, la UI pasa a
    `Personalizado`;
  - la simulacion muestra el loadout y componentes personalizados en resultados;
  - sin errores de consola.

Riesgos / siguientes pasos:
- Nota posterior: la configuracion por grupo de hardpoints quedo sustituida por
  configuracion por slot individual en la entrada del 2026-05-12.
- Power plant y coolers ya afectan firmas EM/IR, pero todavia no modelan fallos
  de energia, calor ni apagados de subsistemas.
- La importacion SP Viewer podria retomarse mas adelante con un proxy/backend o
  con una importacion manual de JSON descomprimido.

### 2026-05-11 - Campo de URL SP Viewer por nave

Objetivo:
Permitir pegar una URL de SP Viewer por bando para vincular la simulacion con
configuraciones externas creadas en esa plataforma.

Archivos tocados:
- `src/utils/spviewerUrl.js`
- `src/hooks/useSimulator.js`
- `src/App.jsx`
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `src/index.css`
- `AI_CHANGELOG.md`

Decision:
Se anaden `shipASpviewerUrl` y `shipBSpviewerUrl` a la configuracion. La nueva
utilidad `parseSpviewerUrl()` valida URLs de `spviewer.eu`, extrae `ship=` o
`vehicle=`, resuelve la nave contra el catalogo local y devuelve un estado para
la UI.

Si la nave existe localmente, el selector de ese bando se sincroniza
automaticamente. Si la URL trae un parametro de loadout reconocible y coincide
con un loadout local, tambien se sincroniza el loadout. La URL completa queda
guardada en la nave resuelta para que aparezca en los resultados.

UI:
- Campo `SP Viewer URL` en cada tarjeta de nave.
- Mensaje de estado con la nave reconocida o el error de URL.
- Resultados muestran `SP Viewer / Vinculada` con la URL usada.

Verificacion:
- Parser probado con:
  - `https://www.spviewer.eu/performance?ship=aegs_gladius`;
  - `https://spviewer.eu/performance?ship=anvl_arrow&loadout=ballistic_cannon`;
  - slug directo `aegs_gladius`;
  - URL externa no valida.
- `npm run build` correcto.
- Visualizador recargado y validado en navegador:
  - el campo aparece para Alfa y Beta;
  - al pegar la URL de Gladius se reconoce la nave;
  - despues de simular, los resultados conservan la URL vinculada.

Riesgos / siguientes pasos:
- Todavia no se descarga ni se interpreta el loadout real de la pagina de SP
  Viewer. Para eso falta identificar si SP Viewer expone el loadout en la URL,
  en HTML embebido o en una API accesible.
- Cuando se conozca ese formato, el siguiente paso sera convertir esa URL en un
  loadout real de armas/componentes dentro de `ships.js`.

### 2026-05-11 - Datos reales de naves importados desde API

Objetivo:
Sustituir los parametros mock principales de las naves por datos reales de Star
Citizen Wiki API.

Archivos tocados:
- `scripts/sync-sc-data.mjs`
- `src/data/generated/vehicles.generated.js`
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `src/components/ShipCard.jsx`
- `AI_CHANGELOG.md`

Decision:
El script `npm run sync:sc-data` ahora genera dos catalogos:
- `weapons.generated.js`, con armas reales;
- `vehicles.generated.js`, con naves reales.

Para naves se consulta `/api/vehicles` y despues el detalle de cada nave para
tener componentes/hardpoints fiables. El catalogo generado incluye 244 naves de
la version:

```txt
4.7.2-LIVE.11674325
```

`ships.js` aplica los datos reales sobre la ficha local cuando encuentra una
coincidencia por slug. Las excepciones actuales son:
- `rsi_aurora_mr` -> `rsi-aurora-gs-mr`;
- `rsi_aurora_ln` -> `rsi-aurora-gs-ln`.

Parametros reales aplicados:
- nombre/fabricante/rol cuando existen en API;
- `hullMax` desde `health`;
- `shieldMax` desde `shield.hp`;
- `shieldRegen` desde `shield.regeneration`;
- `speedSCM` desde `speed.scm`;
- `speedBoost` desde `speed.max`;
- hardpoints desde componentes de tipo `weapons`;
- stock loadout desde `weaponry.fixed_weapons`;
- firma EM/IR/CS normalizada desde `signature`, `emission` y `cross_section`;
- armor real desde `armor.damageMultipliers`.

El motor usa ahora los multiplicadores reales de armor por tipo de dano cuando
estan disponibles. Por ejemplo, el armor fisico real se traduce a mitigacion
base de casco antes de aplicar penetracion.

UI:
- `ShipCard` muestra `Nave: datos reales` y version de datos.
- Las barras de casco/escudo/regeneracion usan escala compatible con HP reales.
- El loadout stock visible en UI sale del stock real importado cuando se puede
  mapear contra el catalogo de armas.

Verificacion:
- `npm run sync:sc-data` correcto:
  - 180 armas;
  - 244 naves.
- Todas las 15 naves actuales tienen correspondencia real en la API.
- Ejemplos tras importar:
  - Gladius: casco 6110, escudo 7920, regen 496/s, hardpoints S3 x3.
  - Arrow: casco 8580, escudo 3960, regen 248/s, hardpoints S3 x2.
  - Buccaneer: casco 9480, escudo 2700, hardpoints S4 x1 + S3 x2 + S1 x2.
- `npm run build` correcto.
- Visualizador recargado y validado:
  - aparece `Nave: datos reales`;
  - aparece `4.7.2-LIVE.11674325`;
  - Gladius muestra casco 6110 y escudo 7920;
  - stock real muestra `Mantis GT-220 Gatling`.
- Prueba Gladius `Balistica Canones` vs Arrow `Balistica Gatlings`:
  - ganador Alfa en 113.3s;
  - dano `physical`;
  - municion finita;
  - armor real aplicado.

Riesgos / siguientes pasos:
- Al usar HP y regeneracion reales, los combates stock duran bastante mas que
  con los mocks antiguos. Hay que recalibrar la escala de DPS/ventanas de fuego
  para tiempos de combate realistas.
- Los campos `accuracy` y `evasion` siguen siendo abstracciones del simulador,
  pero ahora se derivan de agilidad, velocidad, firma y hardpoints reales.
- El siguiente paso recomendado es recalibrar `WEAPON_DPS_TO_SIM_SCALE`,
  capacitor y tracking usando HP/escudos reales como nueva base.

### 2026-05-11 - Loadouts balisticos configurables en UI

Objetivo:
Anadir loadouts balisticos reales para poder probar municion, dano fisico,
penetracion y armor desde escenarios visibles en la UI.

Archivos tocados:
- `src/data/ships.js`
- `src/hooks/useSimulator.js`
- `src/components/ShipCard.jsx`
- `src/components/ResultsPanel.jsx`
- `src/App.jsx`
- `src/index.css`
- `AI_CHANGELOG.md`

Decision:
Las naves ya no se duplican para representar loadouts. `ships.js` mantiene una
nave base y genera variantes de loadout segun sus hardpoints:
- `stock`;
- `ballistic_gatling`;
- `ballistic_cannon`;
- `ballistic_repeater`.

Los loadouts balisticos usan armas reales del catalogo importado:
- S1: YellowJacket / Deadbolt I / Buzzsaw;
- S2: Scorpion GT-215 / Deadbolt II / Sawbuck;
- S3: Mantis GT-220 / Deadbolt III / Shredder;
- S4: AD4B / Deadbolt IV cuando haya hardpoints S4.

`getShipForLoadout(shipId, loadoutId)` resuelve una nave con su armamento,
weapon bank, DPS simulado, municion y firmas recalculadas para ese loadout.

UI:
- `ShipCard` muestra selector de loadout por nave.
- La tarjeta muestra nombre del loadout, descripcion y armas concretas.
- `ResultsPanel` muestra el loadout usado en la simulacion y sus armas.
- El header de la app deja de decir `mock data` y pasa a indicar armas reales y
  loadouts configurables.

Verificacion:
- `npm run build` correcto.
- Prueba directa Gladius `Balistica Canones` vs Arrow `Balistica Gatlings`:
  - dano `physical`;
  - municion finita;
  - 0% de bloqueo por capacitor;
  - los cañones consumieron 102 de 1173 proyectiles;
  - los gatlings consumieron 1036 de 8820 proyectiles.
- Visualizador recargado y validado:
  - aparecen selectores de loadout para Alfa y Beta;
  - aparecen `Balistica Canones`, `Balistica Gatlings`, `Deadbolt II Cannon` y
    `Scorpion GT-215 Gatling`;
  - resultados muestran `physical:` y `Municion`.

Riesgos / siguientes pasos:
- Los loadouts generados son variantes sistematicas por tamano, no loadouts
  canonicos exactos de cada jugador o parche.
- Siguiente paso recomendado: calibrar duraciones y letalidad de loadouts
  balisticos frente a loadouts de energia, especialmente canones Deadbolt.

### 2026-05-11 - Calibracion inicial de armor y penetracion

Objetivo:
Convertir los campos reales de penetracion de armas en una formula mas expresiva
para escudos y casco, evitando usar un unico numero plano.

Archivos tocados:
- `src/data/ships.js`
- `src/engine/combatEngine.js`
- `src/components/ResultsPanel.jsx`
- `AI_CHANGELOG.md`

Decision:
`ships.js` conserva ahora los campos reales completos de penetracion en cada
grupo de arma:
- `thickness`;
- `baseDistance`;
- `nearRadius`;
- `farRadius`.

El motor separa dos efectos:
- `shieldPierce`: cuanto dano fisico sangra a traves del escudo;
- `armorPierce`: cuanto armor del casco ignora el impacto.

La senal principal ya no es `thickness`, porque en la API viene practicamente
constante para casi todas las armas. La formula da mas peso a:
- `baseDistance`, como profundidad/consistencia de penetracion;
- radio medio entre `nearRadius` y `farRadius`, como anchura efectiva de la
  penetracion;
- una caida suave de penetracion cuando el impacto ocurre cerca del rango maximo
  del arma.

Tambien se corrigio el coste de capacitor de armas balisticas: si el grupo de
arma declara `capCostPerShot: 0`, el motor respeta ese cero y no aplica el coste
minimo generico.

UI:
- `ResultsPanel` muestra `Blindaje casco` por nave.
- El valor representa la mitigacion base del casco antes de aplicar la
  penetracion del arma atacante.

Verificacion:
- `npm run build` correcto.
- Simulacion normal Gladius vs Arrow correcta:
  - ganador Alfa;
  - dano separado en escudo/casco;
  - blindaje mostrado: Gladius 14%, Arrow 8%.
- Prueba controlada con dos armas balisticas identicas salvo penetracion:
  - baja penetracion: 729 dano total, 556 a escudo, 172 a casco;
  - alta penetracion: 823 dano total, 449 a escudo, 375 a casco;
  - ambas gastaron 150 proyectiles;
  - 0% de bloqueo por capacitor.
- Visualizador recargado y validado: aparecen `Blindaje casco`,
  `Mitigacion base antes de penetracion` y el desglose `escudo/casco`.

Riesgos / siguientes pasos:
- La formula ya diferencia armas, pero los coeficientes son una calibracion
  inicial. Conviene ajustarlos cuando tengamos combates de referencia o loadouts
  balisticos reales en naves jugables.
- El siguiente paso recomendado es anadir o seleccionar loadouts balisticos
  reales para probar municion, penetracion y armor en escenarios visibles de la
  UI.

### 2026-05-11 - API recuperada y penetracion real importada

Objetivo:
Reintentar la sincronizacion pendiente con Star Citizen Wiki API para refrescar
el catalogo real de armas con los campos de penetracion.

Archivos tocados:
- `src/data/generated/weapons.generated.js`
- `AI_CHANGELOG.md`

Decision:
Se ejecuto de nuevo `npm run sync:sc-data` y esta vez la API respondio
correctamente. El catalogo generado mantiene 180 armas importadas desde:

```txt
4.7.2-LIVE.11674325
```

La normalizacion actual guarda `penetration` por arma cuando el campo existe en
la API:
- `thickness`;
- `baseDistance`;
- `nearRadius`;
- `farRadius`.

Verificacion:
- `npm run sync:sc-data` correcto.
- Catalogo regenerado en `src/data/generated/weapons.generated.js`.
- 176 de 180 armas tienen al menos un valor numerico positivo de penetracion.
- `npm run build` correcto.

Riesgos / siguientes pasos:
- Validar como traducir `baseDistance` y radios de penetracion a la escala de
  armor del simulador.
- Revisar las 4 armas sin penetracion util para decidir si se quedan con
  fallback inferido o requieren ajuste manual.

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
