import { execSync } from 'node:child_process'

/**
 * Global setup untuk Playwright preview-progresif.
 * Membunuh proses tersisa yang menikmati port 4327 (Vite) dan 4328 (SSE mock)
 * sebelum setiap run, agar tidak bentrok dengan daemon mock yang sudah berjalan
 * di port 3456 atau sisa run sebelumnya.
 */
export default async function globalSetup() {
  for (const port of [4327, 4328]) {
    try {
      // netstat -ano | findstr :port  ->  cari PID
      const out = execSync(
        `netstat -ano | findstr :${port}`,
        { encoding: 'utf8', windowsHide: true },
      )
      const lines = out.split('\n').filter((l) => l.trim())
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && pid !== '0') {
          try {
            execSync(`taskkill /F /PID ${pid}`, {
              encoding: 'utf8',
              windowsHide: true,
            })
            console.log(`[global-setup] killed PID ${pid} on port ${port}`)
          } catch {
            // PID mungkin sudah mati; abaikan.
          }
        }
      }
    } catch {
      // findstr tidak menemukan apa-apa (exit code 1) → port bebas.
    }
  }
}
