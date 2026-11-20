import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()

// Halaman inline dengan sandbox PERSIS seperti produksi + srcdoc yang benar
await page.setContent(`
<!DOCTYPE html><html><body>
  <iframe id="sb" sandbox="allow-scripts allow-popups" style="width:400px;height:300px"></iframe>
  <iframe id="nosb" style="width:400px;height:300px"></iframe>
  <script>
    const html = '<!DOCTYPE html><html><head><title>T</title></head><body><h1 id="x">Halo Sandbox</h1><img src=x onerror="console.log(1)"></body></html>'
    document.getElementById('sb').srcdoc = html
    document.getElementById('nosb').srcdoc = html
  </script>
</body></html>`)
await page.waitForTimeout(1500)

const parentView = await page.evaluate(() => {
  const read = (id) => {
    const f = document.getElementById(id)
    return {
      sandboxAttr: f.getAttribute('sandbox'),
      contentDocumentIsNull: f.contentDocument === null,
      contentWindowIsNull: f.contentWindow === null,
      srcdocAttrLen: (f.getAttribute('srcdoc') || '').length,
    }
  }
  let crossOriginError = null
  try {
    document.getElementById('sb').contentDocument.body.innerHTML
  } catch (e) {
    crossOriginError = e.name + ': ' + e.message
  }
  return { sandboxed: read('sb'), unsandboxed: read('nosb'), crossOriginError }
})
console.log('=== PARENT READING SANDBOXED / UNSANDBOXED ===')
console.log(JSON.stringify(parentView, null, 2))

// Playwright via CDP
for (const id of ['sb', 'nosb']) {
  const h = await page.locator('#' + id).elementHandle()
  const fr = h ? await h.contentFrame() : null
  let res
  if (fr) {
    try {
      res = await fr.evaluate(() => ({
        bodyLen: document.body.innerHTML.length,
        h1: document.querySelector('h1')?.textContent ?? null,
        scriptsRan: true,
      }))
    } catch (e) {
      res = { error: e.message }
    }
  } else res = { error: 'contentFrame null' }
  console.log(`=== FRAME.EVALUATE #${id} ===`)
  console.log(JSON.stringify(res, null, 2))
}

// frameLocator
for (const id of ['sb', 'nosb']) {
  try {
    const t = await page.frameLocator('#' + id).locator('h1').first().textContent({ timeout: 3000 })
    console.log(`frameLocator #${id} h1 =`, t)
  } catch (e) {
    console.log(`frameLocator #${id} ERROR:`, e.message.split('\n')[0])
  }
}

await browser.close()
