import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let htmlLegacy = '';
try {
  htmlLegacy = await readFile(path.join(__dirname, 'full_run1.html'), 'utf-8');
  console.log('[mock] Legacy HTML loaded:', htmlLegacy.length, 'chars');
} catch (err) {
  console.error('[mock] Gagal membaca full_run1.html:', err.message);
  process.exit(1);
}

let htmlMinimal = '';
try {
  htmlMinimal = await readFile(path.join(__dirname, 'full_minimal_run1.html'), 'utf-8');
  console.log('[mock] Minimal HTML loaded:', htmlMinimal.length, 'chars');
} catch (err) {
  console.error('[mock] Gagal membaca full_minimal_run1.html:', err.message);
  process.exit(1);
}

/** Pilih sampel dari query fixture=minimal (default: legacy). */
function pickHtml(url) {
  const params = new URL(url ?? '/', 'http://127.0.0.1').searchParams;
  return params.get('fixture') === 'minimal' ? htmlMinimal : htmlLegacy;
}

let testPage = '';
try {
  testPage = await readFile(path.join(__dirname, '..', 'preview-test.html'), 'utf-8');
  console.log('[mock] Test page loaded:', testPage.length, 'chars');
} catch (err) {
  console.error('[mock] Gagal membaca preview-test.html:', err.message);
  process.exit(1);
}

function sseHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });
}

/** Kirim event "status" fase pembukaan stream. */
function writeStatus(res, phase, attempt, elapsedMs) {
  if (res.writableEnded || res.destroyed) return;
  res.write(
    `event: status\ndata: ${JSON.stringify({
      phase,
      attempt,
      elapsed_ms: elapsedMs,
    })}\n\n`,
  );
}

/** Kirim token HTML via interval, lalu event done. */
function streamTokens(res, req, { source = htmlLegacy, tokenSize = 50, intervalMs = 30 } = {}) {
  const tokens = [];
  for (let i = 0; i < source.length; i += tokenSize) {
    tokens.push(source.slice(i, i + tokenSize));
  }

  let idx = 0;
  let finished = false;
  const cleanup = () => {
    finished = true;
    clearInterval(interval);
  };
  const finish = () => {
    if (finished) return;
    cleanup();
    if (!res.writableEnded) {
      res.write(
        `event: done\ndata: ${JSON.stringify({ version_number: 1, html: source })}\n\n`,
      );
      res.end();
    }
  };

  const interval = setInterval(() => {
    if (res.writableEnded || res.destroyed) {
      cleanup();
      return;
    }
    if (idx >= tokens.length) {
      finish();
      console.log('[mock] done after', tokens.length, 'tokens');
      return;
    }
    res.write(`event: token\ndata: ${JSON.stringify({ token: tokens[idx] })}\n\n`);
    idx++;
  }, intervalMs);

  req.on('close', cleanup);
}

const server = createServer((req, res) => {
  // Parse pathname saja: query string tidak boleh menggagalkan pencocokan rute.
  const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
  console.log('[mock]', req.method, pathname, req.url);

  // Halaman uji (semua query string diabaikan; mode dibaca di klien)
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(testPage);
    return;
  }

  // HTML contoh mentah (untuk referensi/unduh)
  if (pathname === '/full_run1.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlLegacy);
    return;
  }
  if (pathname === '/full_minimal_run1.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlMinimal);
    return;
  }

  const source = pickHtml(req.url);

  // SSE normal: token tiap 30 ms, lalu "done"
  if (pathname === '/sse') {
    sseHeaders(res);
    streamTokens(res, req, { source });
    return;
  }

  // SSE status: connecting -> retrying -> fallback -> token pertama.
  if (pathname === '/sse-status') {
    sseHeaders(res);
    const started = Date.now();
    const timers = new Set();
    const schedule = (fn, ms) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
    };
    const stop = () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    };
    req.on('close', stop);
    writeStatus(res, 'connecting', 1, 0);
    schedule(() => writeStatus(res, 'retrying', 2, Date.now() - started), 700);
    schedule(() => writeStatus(res, 'fallback', 2, Date.now() - started), 1400);
    schedule(() => {
      stop();
      streamTokens(res, req, { source, intervalMs: 15 });
    }, 2100);
    return;
  }

  // SSE sibuk: status connecting lalu event error AI_BUSY tanpa token.
  if (pathname === '/sse-busy') {
    sseHeaders(res);
    writeStatus(res, 'connecting', 1, 0);
    const timer = setTimeout(() => {
      if (res.writableEnded || res.destroyed) return;
      res.write(
        `event: error\ndata: ${JSON.stringify({
          success: false,
          error: {
            code: 'AI_BUSY',
            message: 'Server AI sedang ramai. Coba lagi beberapa saat lagi.',
          },
        })}\n\n`,
      );
      res.end();
    }, 1500);
    req.on('close', () => clearTimeout(timer));
    return;
  }

  // SSE status lambat: status connecting, heartbeat, token pertama setelah 23 dtk.
  if (pathname === '/sse-slow-status') {
    sseHeaders(res);
    const started = Date.now();
    writeStatus(res, 'connecting', 1, 0);
    const hb = setInterval(() => {
      if (res.writableEnded || res.destroyed) {
        clearInterval(hb);
        return;
      }
      res.write(`: heartbeat ${Date.now() - started}ms\n\n`);
    }, 1000);
    const firstToken = setTimeout(() => {
      clearInterval(hb);
      if (res.writableEnded || res.destroyed) return;
      console.log('[mock] sse-slow-status: first token after', Date.now() - started, 'ms');
      streamTokens(res, req, { source, intervalMs: 15 });
    }, 23_000);
    req.on('close', () => {
      clearInterval(hb);
      clearTimeout(firstToken);
    });
    return;
  }

  // SSE tunggu awal panjang: heartbeat komentar 40 detik sebelum token pertama
  // (produksi: model bisa baru merespons setelah puluhan detik sampai >1 menit)
  if (pathname === '/sse-slow') {
    sseHeaders(res);
    const HEARTBEAT_MS = 40_000;
    const start = Date.now();
    const hb = setInterval(() => {
      if (res.writableEnded || res.destroyed) {
        clearInterval(hb);
        return;
      }
      res.write(`: heartbeat ${Date.now() - start}ms\n\n`);
    }, 1000);
    setTimeout(() => {
      clearInterval(hb);
      if (res.writableEnded || res.destroyed) return;
      console.log('[mock] sse-slow: first token after', Date.now() - start, 'ms');
      streamTokens(res, req, { source, intervalMs: 15 });
    }, HEARTBEAT_MS);
    req.on('close', () => clearInterval(hb));
    return;
  }

  // SSE error di tengah stream: ~700 token lalu event "error"
  // (kejadian nyata: provider mengembalikan 503 di tengah stream)
  if (pathname === '/sse-mid-error') {
    sseHeaders(res);
    // ~700 token, berhenti sebelum akhir dokumen (error di tengah stream).
    const TOKEN_SIZE = Math.max(1, Math.floor(source.length / 760));
    const PARTIAL = source.slice(0, TOKEN_SIZE * 700);
    const tokens = [];
    for (let i = 0; i < PARTIAL.length; i += TOKEN_SIZE) {
      tokens.push(PARTIAL.slice(i, i + TOKEN_SIZE));
    }
    let idx = 0;
    const cleanup = () => {
      clearInterval(interval);
    };
    const interval = setInterval(() => {
      if (res.writableEnded || res.destroyed) {
        cleanup();
        return;
      }
      if (idx >= tokens.length) {
        cleanup();
        console.log('[mock] sse-mid-error: error after', tokens.length, 'tokens');
        res.write(
          `event: error\ndata: ${JSON.stringify({
            success: false,
            error: {
              code: 'AI_PROVIDER_ERROR',
              message: 'Provider AI mengembalikan 503 di tengah stream.',
              reason: 'PROVIDER_ERROR',
            },
          })}\n\n`,
        );
        res.end();
        return;
      }
      res.write(`event: token\ndata: ${JSON.stringify({ token: tokens[idx] })}\n\n`);
      idx++;
    }, 5);
    req.on('close', cleanup);
    return;
  }

  // SSE yang terputus tanpa event done
  if (pathname === '/sse-error') {
    sseHeaders(res);
    res.write(
      `event: token\ndata: ${JSON.stringify({ token: '<!DOCTYPE html><html><head><title>X</title></head><body><h1>Setengah</h1>' })}\n\n`,
    );
    setTimeout(() => {
      if (!res.writableEnded) res.end();
    }, 400);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found: ' + pathname);
});

server.on('error', (err) => {
  console.error('[mock] server error:', err.message);
  process.exit(1);
});

const PORT = (() => {
  const idx = process.argv.indexOf('--port');
  if (idx >= 0 && idx + 1 < process.argv.length) {
    return parseInt(process.argv[idx + 1], 10) || 3456;
  }
  return 3456;
})();

server.listen(PORT, '127.0.0.1', () => {
  console.log('[mock] listening on http://127.0.0.1:' + PORT);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
  });
}
