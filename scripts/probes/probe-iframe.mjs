import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:3456'
const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', (msg) => console.log('[page]', msg.type(), msg.text()))

await page.goto(`${BASE}/?mode=after`)
await page.waitForTimeout(6000)

// 1. Apa yang dilihat halaman induk (same-origin path)
const parentView = await page.evaluate(() => {
  const a = document.getElementById('frame-a')
  const b = document.getElementById('frame-b')
  const pick = (f) => ({
    hasDoc: !!f.contentDocument,
    bodyLen: f.contentDocument?.body?.innerHTML.length ?? -1,
    srcdocAttrLen: (f.getAttribute('srcdoc') || '').length,
    active: f.classList.contains('active'),
    sandbox: f.getAttribute('sandbox'),
  })
  return { frameA: pick(a), frameB: pick(b) }
})
console.log('=== PARENT VIEW (contentDocument dari induk) ===')
console.log(JSON.stringify(parentView, null, 2))

// 2. Frame tree versi Playwright (CDP)
const frames = page.frames()
console.log('=== page.frames() ===')
for (const f of frames) {
  console.log('url=', f.url(), 'name=', f.name())
}

// 3. elementHandle.contentFrame() + frame.evaluate (jalur CDP lintas origin)
const handle = await page.locator('#frame-a').elementHandle()
const frame = handle ? await handle.contentFrame() : null
console.log('contentFrame() =>', frame ? `url=${frame.url()}` : 'null')
if (frame) {
  const inside = await frame.evaluate(() => ({
    bodyLen: document.body ? document.body.innerHTML.length : -1,
    h1: document.querySelector('h1')?.textContent ?? null,
    htmlHasJs: document.documentElement.classList.contains('js'),
    revealCount: document.querySelectorAll('.reveal').length,
  }))
  console.log('=== frame.evaluate (CDP) ===')
  console.log(JSON.stringify(inside, null, 2))
}

// 4. frameLocator path
const fl = page.frameLocator('#frame-a')
const h1Text = await fl.locator('h1').first().textContent().catch((e) => `ERR: ${e.message}`)
console.log('=== frameLocator h1 ===', h1Text)

await browser.close()
