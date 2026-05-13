import { chmod, copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const portableDir = path.join(rootDir, 'portable')
const appDir = path.join(portableDir, 'app')

await rm(portableDir, { recursive: true, force: true })
await mkdir(appDir, { recursive: true })

await copyDirectory(distDir, appDir)
await writeLaunchers()
await writeReadme()

console.log(`Portable listo en ${portableDir}`)

async function copyDirectory(fromDir, toDir) {
  const entries = await readdir(fromDir, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = path.join(fromDir, entry.name)
    const targetPath = path.join(toDir, entry.name)

    if (entry.isDirectory()) {
      await mkdir(targetPath, { recursive: true })
      await copyDirectory(sourcePath, targetPath)
      continue
    }

    await copyFile(sourcePath, targetPath)
  }
}

async function writeLaunchers() {
  const commandPath = path.join(portableDir, 'Abrir SC Combat Simulator.command')
  const batPath = path.join(portableDir, 'Abrir SC Combat Simulator.bat')
  const shPath = path.join(portableDir, 'abrir-sc-combat-simulator.sh')

  await writeFile(
    commandPath,
    [
      '#!/bin/bash',
      'DIR="$(cd "$(dirname "$0")" && pwd)"',
      'PORT="$(python3 - <<\'PY\'',
      'import socket',
      'sock = socket.socket()',
      'sock.bind(("127.0.0.1", 0))',
      'print(sock.getsockname()[1])',
      'sock.close()',
      'PY',
      ')"',
      'cd "$DIR/app" || exit 1',
      'python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/sc-combat-simulator.log 2>&1 &',
      'SERVER_PID=$!',
      'sleep 1',
      'open "http://127.0.0.1:$PORT"',
      'wait $SERVER_PID',
      '',
    ].join('\n'),
    'utf8',
  )

  await writeFile(
    batPath,
    [
      '@echo off',
      'start "" "%~dp0app\\index.html"',
      '',
    ].join('\r\n'),
    'utf8',
  )

  await writeFile(
    shPath,
    [
      '#!/usr/bin/env bash',
      'DIR="$(cd "$(dirname "$0")" && pwd)"',
      'xdg-open "$DIR/app/index.html" >/dev/null 2>&1 &',
      '',
    ].join('\n'),
    'utf8',
  )

  await chmod(commandPath, 0o755)
  await chmod(shPath, 0o755)
}

async function writeReadme() {
  const packageJsonPath = path.join(rootDir, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
  const readmePath = path.join(portableDir, 'LEEME.txt')

  await writeFile(
    readmePath,
    [
      'SC Combat Simulator',
      '',
      `Version del paquete: ${packageJson.version ?? '0.1.0'}`,
      '',
      'Como abrirlo:',
      '- macOS: doble clic en "Abrir SC Combat Simulator.command"',
      '- Windows: doble clic en "Abrir SC Combat Simulator.bat"',
      '- Linux: doble clic en "abrir-sc-combat-simulator.sh" o abre "app/index.html"',
      '',
      'No hace falta usar npm ni ejecutar comandos manualmente.',
      'La aplicacion se abre en tu navegador por defecto.',
      '',
      'Si prefieres, tambien puedes abrir directamente:',
      '- app/index.html',
      '',
      'Nota:',
      '- En macOS el lanzador abre un servidor local minimo para evitar el problema de las paginas en blanco al abrir index.html directamente en Chrome.',
      '- Algunas imagenes de naves se cargan desde internet, asi que conviene tener conexion.',
      '',
    ].join('\n'),
    'utf8',
  )
}
