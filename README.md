## Version portable para compartir

Este proyecto se puede preparar para personas no tecnicas sin usar `npm run dev`.

### Generar paquete portable

```bash
npm run build:portable
```

Esto crea una carpeta [`portable`](/Users/javiervelascotejedor/Documents/Sc_Combat_Simulator/portable) con:

- `app/` — la aplicacion ya construida
- `Abrir SC Combat Simulator.command` — lanzador para macOS
- `Abrir SC Combat Simulator.bat` — lanzador para Windows
- `abrir-sc-combat-simulator.sh` — lanzador para Linux
- `LEEME.txt` — instrucciones simples para usuarios finales

### Como compartirlo

Lo mas sencillo es comprimir la carpeta `portable/` y compartir ese `.zip`.

La persona que lo reciba solo tiene que:

- descomprimirlo
- hacer doble clic en el lanzador de su sistema

No necesita instalar dependencias ni ejecutar comandos.
