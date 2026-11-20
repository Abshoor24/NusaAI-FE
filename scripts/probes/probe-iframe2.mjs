import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:3456'
const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', (msg) => console.log('[page]', msg.type(), msg.text()))

await page.goto(`${BASE}/?mode=after`)
await page.waitForTimeout(8000)

// 1. Coba frameLocator untuk mencari h1 di dalam iframe
console.log('\n=== TEST frameLocator ===')
try {
  const h1 = await page.frameLocator('#frame-a').locator('h1').first()
  const h1Count = await h1.count()
  console.log('frameLocator #frame-a h1 count:', h1Count)
  if (h1Count > 0) {
    const text = await h1.textContent()
    console.log('frameLocator h1 text:', text)
  }
} catch (e) {
  console.log('frameLocator #frame-a ERROR:', e.message)
}

try {
  const h1b = await page.frameLocator('#frame-b').locator('h1').first()
  const h1bCount = await h1b.count()
  console.log('frameLocator #frame-b h1 count:', h1bCount)
  if (h1bCount > 0) {
    const text = await h1b.textContent()
    console.log('frameLocator #frame-b h1 text:', text)
  }
} catch (e) {
  console.log('frameLocator #frame-b ERROR:', e.message)
}

// 2. Coba elementHandle.contentFrame()
console.log('\n=== TEST contentFrame ===')
const ha = await page.locator('#frame-a').elementHandle()
const fa = ha ? await ha.contentFrame() : null
console.log('frame-a contentFrame:', fa ? `url=${fa.url()}` : 'null')
if (fa) {
  try {
    const bodyLen = await fa.evaluate(() => document.body ? document.body.innerHTML.length : -1)
    console.log('frame-a bodyLen via contentFrame:', bodyLen)
  } catch (e) {
    console.log('frame-a contentFrame eval ERROR:', e.message)
  }
}

const hb = await page.locator('#frame-b').elementHandle()
const fb = hb ? await hb.contentFrame() : null
console.log('frame-b contentFrame:', fb ? `url=${fb.url()}` : 'null')
if (fb) {
  try {
    const bodyLen = await fb.evaluate(() => document.body ? document.body.innerHTML.length : -1)
    console.log('frame-b bodyLen via contentFrame:', bodyLen)
  } catch (e) {
    console.log('frame-b contentFrame eval ERROR:', e.message)
  }
}

// 3. Coba page.frames() untuk semua frame
console.log('\n=== TEST page.frames() ===')
for (const f of page.frames()) {
  console.log('frame url:', f.url(), 'name:', f.name())
}

// 4. Coba cari semua h1 di semua frame via frameLocator generik
console.log('\n=== TEST all frameLocators ===')
for (const f of page.frames()) {
  if (f.url().includes('about:blank')) {
    try {
      const h1s = await f.locator('h1').count()
      console.log('about:blank frame h1 count:', h1s)
      if (h1s > 0) {
        const text = await f.locator('h1').first().textContent()
        console.log('about:blank frame h1 text:', text)
      }
    } catch (e) {
      console.log('about:blank frame eval ERROR:', e.message)
    }
  }
}

// 5. Cek atribut srcdoc dan properti srcDoc
console.log('\n=== TEST srcdoc attribute ===')
const attrInfo = await page.evaluate(() => {
  const a = document.getElementById('frame-a')
  const b = document.getElementById('frame-b')
  return {
    a_srcdoc_attr: a.getAttribute('srcdoc'),
    a_srcDoc_prop: a.srcDoc ? '(set)' : '(empty)',
    b_srcdoc_attr: b.getAttribute('srcdoc'),
    b_srcDoc_prop: b.srcDoc ? '(set)' : '(empty)',
    a_sandbox: a.getAttribute('sandbox'),
    b_sandbox: b.getAttribute('sandbox'),
  }
})
console.log(JSON.stringify(attrInfo, null, 2))

await browser.close()
