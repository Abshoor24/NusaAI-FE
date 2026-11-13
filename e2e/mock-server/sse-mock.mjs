import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let htmlFull = '';
try {
  htmlFull = await readFile(path.join(__dirname, 'full_run1.html'), 'utf-8');
  console.log('[mock] HTML loaded:', htmlFull.length, 'chars');
} catch (err) {
  console.error('[mock] Gagal membaca full_run1.html:', err.message);
  process.exit(1);
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

/** Kirim token htmlFull via interval, lalu event done. */
function streamTokens(res, req, { tokenSize = 50, intervalMs = 30, prefix = '' } = {}) {
  const source = prefix + htmlFull;
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
    res.end(htmlFull);
    return;
  }

  // SSE normal: token tiap 30 ms, lalu "done"
  if (pathname === '/sse') {
    sseHeaders(res);
    streamTokens(res, req);
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
      streamTokens(res, req, { intervalMs: 15 });
    }, HEARTBEAT_MS);
    req.on('close', () => clearInterval(hb));
    return;
  }

  // SSE error di tengah stream: ~700 token lalu event "error"
  // (kejadian nyata: provider mengembalikan 503 di tengah stream)
  if (pathname === '/sse-mid-error') {
    sseHeaders(res);
    const PARTIAL = htmlFull.slice(0, 36_000); // ~700 token @50 char
    const tokens = [];
    for (let i = 0; i < PARTIAL.length; i += 50) {
      tokens.push(PARTIAL.slice(i, i + 50));
    }
    let idx = 0;
    let finished = false;
    const cleanup = () => {
      finished = true;
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
          `event: error\ndata: ${JSON.stringify({ message: 'Provider AI mengembalikan 503 di tengah stream.' })}\n\n`,
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
