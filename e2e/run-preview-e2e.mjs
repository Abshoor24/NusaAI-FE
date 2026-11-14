import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const children = []

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

function killTree(pid) {
  if (!pid) return
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
    } catch {
      // Proses sudah berhenti.
    }
    return
  }
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    // Proses sudah berhenti.
  }
}

function shellCommand(command, args) {
  if (process.platform !== 'win32') return [command, args]
  const line = [command, ...args]
    .map((part) => (/[\s"|&<>^()]/.test(part) ? `"${part.replace(/"/g, '\\"')}"` : part))
    .join(' ')
  return [process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', line]]
}

function start(name, command, args, { env = {}, shell = false } = {}) {
  const [file, fileArgs] = shell ? shellCommand(command, args) : [command, args]
  const child = spawn(file, fileArgs, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    windowsHide: true,
  })
  children.push(child)
  child.on('exit', (code) => console.log(`[runner] ${name} exited (${code})`))
  return child
}

async function waitFor(url, name, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        console.log(`[runner] ${name} siap: ${url}`)
        return
      }
    } catch {
      // belum siap
    }
    await delay(300)
  }
  throw new Error(`${name} tidak siap dalam ${timeoutMs}ms: ${url}`)
}

async function main() {
  const vitePort = await freePort()
  let ssePort = await freePort()
  while (ssePort === vitePort) ssePort = await freePort()

  const baseURL = `http://127.0.0.1:${vitePort}`
  const sseURL = `http://127.0.0.1:${ssePort}`
  console.log(`[runner] port bebas: vite=${vitePort} sse=${ssePort}`)

  start('vite', 'npx', ['vite', '--host', '127.0.0.1', '--port', String(vitePort), '--strictPort'], {
    shell: true,
  })
  start('sse-mock', process.execPath, ['e2e/mock-server/sse-mock.mjs', '--port', String(ssePort)])

  let exitCode = 1
  try {
    await Promise.all([
      waitFor(`${baseURL}/e2e/harness.html`, 'vite'),
      waitFor(`${sseURL}/full_minimal_run1.html`, 'sse-mock'),
    ])

    exitCode = await new Promise((resolve) => {
      const [file, args] = shellCommand('npx', [
        'playwright',
        'test',
        '-c',
        'playwright.preview.config.ts',
        '--reporter=list',
        ...process.argv.slice(2),
      ])
      const playwright = spawn(file, args, {
        cwd: root,
        env: { ...process.env, PREVIEW_BASE_URL: baseURL, PREVIEW_SSE_URL: sseURL },
        stdio: 'inherit',
        windowsHide: true,
      })
      children.push(playwright)
      playwright.on('exit', (code) => resolve(code ?? 1))
    })
  } finally {
    for (const child of children) killTree(child.pid)
    await delay(800)
  }

  process.exit(exitCode)
}

main().catch((err) => {
  console.error('[runner] gagal:', err)
  for (const child of children) killTree(child.pid)
  process.exit(1)
})
