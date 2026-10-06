/**
 * Perbaikan khusus PRATINJAU untuk tautan fragmen (#anchor) di HTML hasil AI.
 *
 * Masalah terukur (Fase 4): dokumen srcdoc mewarisi base URL aplikasi,
 * sehingga klik `<a href="#produk">` BUKAN menggulir dalam iframe, melainkan
 * menavigasi iframe ke URL aplikasi + `#produk` — konten AI hilang dan area
 * pratinjau tampak putih/rusak walau status "Siap".
 *
 * Syarat yang dipatuhi:
 * - HANYA dipakai untuk `srcDoc` di PreviewFrame (render pratinjau).
 * - TIDAK menyentuh atribut sandbox iframe.
 * - TIDAK mengubah HTML yang tersimpan maupun yang diunduh (unduhan memakai
 *   blob dari server, bukan string ini).
 * - Hanya tautan fragmen dokumen-sama (tanpa target / target=_self) yang
 *   dicegat; target=_blank, http/https, mailto:, tel: tidak berubah.
 */

const MARKER = 'data-pakhir-anchor-fix'

const FIX_SCRIPT = `<script ${MARKER}>(function(){document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href^="#"]'):null;if(!a)return;var t=a.getAttribute('target');if(t&&t!=='_self')return;var raw=a.getAttribute('href')||'';if(raw==='#'){e.preventDefault();window.scrollTo(0,0);return;}if(raw.length<2)return;var id=raw.slice(1);try{id=decodeURIComponent(id);}catch(err){}var dest=document.getElementById(id);if(!dest){try{dest=document.querySelector('[name="'+id.replace(/"/g,'')+'"]');}catch(err2){dest=null;}}if(!dest)return;e.preventDefault();dest.scrollIntoView();},false);})();</script>`

/**
 * Sisipkan skrip pencegat tautan fragmen ke HTML pratinjau.
 * Idempoten: bila penanda sudah ada, HTML dikembalikan apa adanya.
 */
export function withPreviewAnchorFix(html: string): string {
  if (!html || html.includes(MARKER)) return html
  const closeBody = html.search(/<\/body\s*>/i)
  if (closeBody === -1) return html + FIX_SCRIPT
  return html.slice(0, closeBody) + FIX_SCRIPT + html.slice(closeBody)
}
