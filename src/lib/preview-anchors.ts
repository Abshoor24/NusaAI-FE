/**
 * Perbaikan khusus PRATINJAU untuk tautan fragmen (#anchor) dan tautan luar di HTML hasil AI.
 *
 * Syarat yang dipatuhi:
 * - HANYA dipakai untuk `srcDoc` di PreviewFrame (render pratinjau).
 * - TIDAK menyentuh atribut sandbox iframe.
 * - TIDAK mengubah HTML yang tersimpan maupun yang diunduh.
 * - Hanya tautan http:// dan https:// (case-insensitive) yang diberi target="_blank" di pratinjau.
 * - Tautan mailto:, tel:, javascript:, data:, blob: TIDAK disentuh (tanpa target/rel tambahan).
 * - Handler hanya memakai event 'click' untuk mencegah eksekusi ganda pada tombol Enter.
 */

const MARKER = 'data-pakhir-anchor-fix'

const FIX_SCRIPT = `<script ${MARKER}>(function(){if(window._pakhirFix)document.removeEventListener('click',window._pakhirFix,false);window._pakhirFix=function(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var raw=a.getAttribute('href')||'';if(!raw)return;if(raw.startsWith('#')){var t=a.getAttribute('target');if(t&&t!=='_self')return;e.preventDefault();if(raw==='#'){window.scrollTo(0,0);return;}if(raw.length<2)return;var id=raw.slice(1);try{id=decodeURIComponent(id);}catch(err){}var dest=document.getElementById(id);if(!dest){try{var nameMatches=document.getElementsByName(id);if(nameMatches&&nameMatches.length>0)dest=nameMatches[0];}catch(err2){dest=null;}}if(dest&&dest.scrollIntoView)dest.scrollIntoView();}else if(/^https?:\\/\\//i.test(raw)){var target=a.getAttribute('target');if(!target||target==='_self'){a.setAttribute('target','_blank');if(!a.getAttribute('rel'))a.setAttribute('rel','noopener noreferrer');}}};document.addEventListener('click',window._pakhirFix,false);})();</script>`

/**
 * Sisipkan skrip pencegat tautan fragmen dan penyesuai pratinjau ke HTML pratinjau.
 * Idempoten: bila penanda sudah ada, HTML dikembalikan apa adanya.
 */
export function withPreviewAnchorFix(html: string): string {
  if (!html || html.includes(MARKER)) return html
  const matches = [...html.matchAll(/<\/body\s*>/gi)]
  if (matches.length === 0) return html + FIX_SCRIPT
  const lastMatch = matches[matches.length - 1]
  const closeBodyIndex = lastMatch.index ?? -1
  if (closeBodyIndex === -1) return html + FIX_SCRIPT
  return html.slice(0, closeBodyIndex) + FIX_SCRIPT + html.slice(closeBodyIndex)
}
