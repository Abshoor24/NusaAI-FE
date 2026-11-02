# check-site.ps1 (versi V7.3)
# Pemeriksa otomatis untuk HTML hasil AI generator. Untuk Windows PowerShell 5.1.
# File ini sengaja ASCII saja (PowerShell 5.1 salah baca UTF-8 tanpa BOM).
#
# Contoh (dari folder fe, ganti nama file):
#   powershell -ExecutionPolicy Bypass -File docs\check-site.ps1 -Path docs\test-a.html -ExpectMenu -Primary 4A2C1A -Accent C8873A -WhatsApp 6281200000000 -Address "Jl. Contoh No. 12"
#   powershell -ExecutionPolicy Bypass -File docs\check-site.ps1 -Path docs\test-b.html -Primary 4A2C1A -Accent C8873A -WhatsApp 6281200000000 -Address "Jl. Contoh No. 12"
#
# -ExpectMenu : brief berisi menu dan harga (tanpa saklar ini, harga dianggap tidak boleh ada)
# Skrip hanya MEMBACA file. Tidak mengubah apa pun.
#
# Perubahan V7.3 dibanding versi V7.2:
# - header bg-transparent tidak lagi dianggap berlatar
# - meta description, alt, aria-label ikut diperiksa untuk kata terlarang
# - kata puji (V72-8, V73-5) dan kata proses/pesanan (V73-4) sekarang FAIL
# - cek kelas pil status V73-1, teks hantu (aria-hidden), tautan peta tanpa alamat (V73-7)
# - cek PRIMARY/ACCENT/NONE di baris FACTS dan hex di tailwind.config (V73-6)

param(
    [Parameter(Mandatory = $true)][string]$Path,
    [switch]$ExpectMenu,
    [string]$Primary = '',
    [string]$Accent = '',
    [string]$WhatsApp = '',
    [string]$Address = ''
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path)) {
    Write-Host ("File tidak ditemukan: " + $Path) -ForegroundColor Red
    exit 2
}

$ci = [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
$cs = [System.Text.RegularExpressions.RegexOptions]::None
$ml = [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase

$raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8

# Teks yang benar-benar tampil: buang komentar, script, style, lalu tag
$noComments = [regex]::Replace($raw, '<!--.*?-->', ' ', $ml)
$noCode = [regex]::Replace($noComments, '<(script|style)\b.*?</\1>', ' ', $ml)
$visible = [regex]::Replace($noCode, '<[^>]+>', ' ')
$visible = [regex]::Replace($visible, '\s+', ' ')

# Teks di atribut yang juga terbaca orang/mesin: meta description, alt, aria-label
$attrParts = New-Object System.Collections.ArrayList
$attrPatterns = @(
    '<meta[^>]*name="description"[^>]*content="([^"]*)"',
    '<meta[^>]*content="([^"]*)"[^>]*name="description"',
    '\balt="([^"]*)"',
    'aria-label="([^"]*)"'
)
foreach ($rx in $attrPatterns) {
    foreach ($m in [regex]::Matches($noComments, $rx, $ci)) { [void]$attrParts.Add($m.Groups[1].Value) }
}
$attrText = ($attrParts -join ' ')
$scan = $visible + ' ' + $attrText

$results = New-Object System.Collections.ArrayList

function Add-Result([string]$status, [string]$check, [string]$detail) {
    [void]$results.Add([pscustomobject]@{ Status = $status; Check = $check; Detail = $detail })
}

function Count-Rx([string]$text, [string]$pattern, $options) {
    return [regex]::Matches($text, $pattern, $options).Count
}

function Check-Words([string]$level, [string]$label, [string[]]$words) {
    $hits = @()
    foreach ($w in $words) {
        $n = Count-Rx $scan ('\b' + [regex]::Escape($w) + '\b') $ci
        if ($n -gt 0) { $hits += ("{0} x{1}" -f $w, $n) }
    }
    if ($hits.Count -gt 0) { Add-Result $level $label ($hits -join ', ') }
    else { Add-Result 'PASS' $label 'tidak ada' }
}

function Check-Needle([string]$label, [string]$needle) {
    if ($needle -eq '') { return }
    $n = Count-Rx $raw ([regex]::Escape($needle.TrimStart('#'))) $ci
    if ($n -ge 1) { Add-Result 'PASS' $label ("ditemukan x{0}" -f $n) }
    else { Add-Result 'FAIL' $label 'tidak ditemukan' }
}

# 1. DESIGN PLAN
$planCount = Count-Rx $raw 'DESIGN PLAN' $cs
$planPos = $raw.IndexOf('DESIGN PLAN', [StringComparison]::Ordinal)
$titlePos = $raw.IndexOf('<title', [StringComparison]::OrdinalIgnoreCase)
if ($planCount -lt 1) { Add-Result 'FAIL' 'DESIGN PLAN ada' 'komentar rencana desain tidak ada' }
elseif (($titlePos -ge 0) -and ($planPos -gt $titlePos)) { Add-Result 'WARN' 'DESIGN PLAN ada' 'ada, tapi bukan di awal head' }
else { Add-Result 'PASS' 'DESIGN PLAN ada' 'ok' }

# 2. Kata di teks yang tampil (termasuk meta description, alt, aria-label)
Check-Words 'FAIL' 'Kata terlarang (V7-3)' @('terbaik', 'premium', 'otentik', 'istimewa', 'sempurna', 'sepenuh hati', 'dengan cinta', 'presisi', 'artisan', 'artisanal', 'single origin', 'petani lokal', 'per batch', 'sesuai permintaan')
Check-Words 'FAIL' 'Kata puji (V72-8, V73-5)' @('berkualitas', 'racik', 'racikan', 'panggang', 'tak terlupakan', 'pengalaman unik', 'kami percaya', 'bangga', 'terpercaya', 'nomor satu')
Check-Words 'FAIL' 'Kata proses/pesanan (V73-4)' @('stok', 'ketersediaan', 'konfirmasi', 'mengonfirmasi', 'diambil', 'ambil', 'antar', 'kirim', 'dikirim', 'pengiriman', 'bayar', 'pembayaran', 'responsif', 'cepat balas')
Check-Words 'FAIL' 'Kata internal tampil' @('Signature Widget', 'Design Plan', 'Placeholder', 'Lorem', 'Hero', 'CTA')
Check-Words 'WARN' 'Klaim: cek ada di brief?' @('segar', 'tim kami', 'keluarga')

# 3. Data karangan, sisa template, tautan palsu
$bad = @('kopisenja', 'Meranti', '081234567890', 'YourGoogle', 'example.com/', 'link-here', 'maps/embed', '<iframe', 'Syne', 'maps.google.com/?q=Purwokerto')
$hits = @()
foreach ($b in $bad) {
    $n = Count-Rx $raw ([regex]::Escape($b)) $ci
    if ($n -gt 0) { $hits += ("{0} x{1}" -f $b, $n) }
}
if ($hits.Count -gt 0) { Add-Result 'FAIL' 'Sisa template / tautan palsu' ($hits -join ', ') }
else { Add-Result 'PASS' 'Sisa template / tautan palsu' 'tidak ada' }

# 4. Harga
$priceCount = Count-Rx $visible 'Rp\s?\d' $ci
$zeroPrice = Count-Rx $visible 'Rp\s(0|-)(?![\d.,])|Rp-' $ci
$zeroTotal = Count-Rx $visible 'Rp0(?![\d.,])' $ci
if ($zeroPrice -gt 0) { Add-Result 'FAIL' 'Harga nol / strip' ("{0} kali (Rp 0 atau Rp -)" -f $zeroPrice) }
elseif ($zeroTotal -gt 0) { Add-Result 'PASS' 'Harga nol / strip' ("tidak ada (Rp0 x{0} dianggap total keranjang awal, cek manual)" -f $zeroTotal) }
else { Add-Result 'PASS' 'Harga nol / strip' 'tidak ada' }
if ($ExpectMenu) {
    if ($priceCount -ge 1) { Add-Result 'PASS' 'Harga dari brief tampil' ("{0} harga" -f $priceCount) }
    else { Add-Result 'FAIL' 'Harga dari brief tampil' 'tidak ada harga padahal brief memuatnya' }
}
else {
    if ($priceCount -eq 0) { Add-Result 'PASS' 'Tanpa harga (brief tanpa menu)' 'ok' }
    else { Add-Result 'FAIL' 'Tanpa harga (brief tanpa menu)' ("ada {0} harga, kemungkinan dikarang" -f $priceCount) }
}

# 5. Data isian
Check-Needle 'Warna utama dipakai' $Primary
Check-Needle 'Warna aksen dipakai' $Accent
Check-Needle 'Nomor WhatsApp dipakai' $WhatsApp
if ($Address -ne '') {
    $n = Count-Rx $visible ([regex]::Escape($Address)) $ci
    if ($n -gt 2) { Add-Result 'WARN' 'Alamat tidak berulang' ("alamat tampil {0} kali" -f $n) }
    else { Add-Result 'PASS' 'Alamat tidak berulang' ("tampil {0} kali" -f $n) }
}

# 5b. V73-6: hex dari brief harus ada di tailwind.config (dicari dalam 4000 karakter setelahnya)
$tc = $raw.IndexOf('tailwind.config', [StringComparison]::OrdinalIgnoreCase)
$colorPairs = @(@('utama', $Primary), @('aksen', $Accent))
foreach ($pair in $colorPairs) {
    $hex = ([string]$pair[1]).TrimStart('#')
    if ($hex -ne '') {
        $lbl = ("Warna {0} di config (V73-6)" -f $pair[0])
        if ($tc -lt 0) { Add-Result 'WARN' $lbl 'tailwind.config tidak ditemukan' }
        else {
            $len = [Math]::Min(4000, $raw.Length - $tc)
            $seg = $raw.Substring($tc, $len)
            if ((Count-Rx $seg ([regex]::Escape($hex)) $ci) -ge 1) { Add-Result 'PASS' $lbl 'ada' }
            else { Add-Result 'FAIL' $lbl 'hex dari brief tidak ada di tailwind.config' }
        }
    }
}

# 6. Animasi
$kf = Count-Rx $raw '@keyframes' $ci
if ($kf -ge 2) { Add-Result 'PASS' 'Keyframes (rise, float)' ("{0} blok" -f $kf) }
else { Add-Result 'FAIL' 'Keyframes (rise, float)' ("hanya {0} blok" -f $kf) }
if ((Count-Rx $raw 'prefers-reduced-motion' $ci) -ge 1) { Add-Result 'PASS' 'prefers-reduced-motion' 'ada' }
else { Add-Result 'FAIL' 'prefers-reduced-motion' 'tidak ada' }
if ((Count-Rx $raw "classList\.add\('js'\)" $cs) -ge 1) { Add-Result 'PASS' 'Kelas js di html' 'ada' }
else { Add-Result 'FAIL' 'Kelas js di html' 'tidak ada (reveal bisa membuat konten tersembunyi)' }
$secReveal = Count-Rx $raw '<section[^>]*class="[^"]*\breveal\b' $ci
if ($secReveal -gt 0) { Add-Result 'FAIL' 'reveal tidak di section' ("{0} section memakai reveal" -f $secReveal) }
else { Add-Result 'PASS' 'reveal tidak di section' 'ok' }
$conf1 = Count-Rx $raw 'class="[^"]*\breveal\b[^"]*(hover:-translate|active:scale)[^"]*"' $ci
$conf2 = Count-Rx $raw 'class="[^"]*(hover:-translate|active:scale)[^"]*\breveal\b[^"]*"' $ci
$conf = $conf1 + $conf2
if ($conf -gt 0) { Add-Result 'FAIL' 'reveal + hover tidak bentrok (V7-8)' ("{0} elemen bentrok, hover tidak akan jalan" -f $conf) }
else { Add-Result 'PASS' 'reveal + hover tidak bentrok (V7-8)' 'ok' }

# 7. Menu HP
$hdrClose = $raw.IndexOf('</header>', [StringComparison]::OrdinalIgnoreCase)
$mm = $raw.IndexOf('id="mobile-menu"', [StringComparison]::Ordinal)
if ($mm -lt 0) { Add-Result 'WARN' 'Menu HP di luar header' 'id="mobile-menu" tidak ditemukan' }
elseif (($hdrClose -ge 0) -and ($mm -lt $hdrClose)) { Add-Result 'FAIL' 'Menu HP di luar header' 'panel menu ada DI DALAM header' }
else { Add-Result 'PASS' 'Menu HP di luar header' 'ok' }
$tx = Count-Rx $raw 'translate-x-full' $ci
if ($tx -gt 0) { Add-Result 'WARN' 'Menu HP tanpa translate (V7-6)' ("translate-x-full x{0}, uji menu HP di browser" -f $tx) }
else { Add-Result 'PASS' 'Menu HP tanpa translate (V7-6)' 'ok' }

# 8. Emoji sebagai ikon
$emo = Count-Rx $visible '[\u2600-\u27BF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]' $cs
if ($emo -gt 0) { Add-Result 'WARN' 'Tanpa emoji' ("{0} karakter emoji/simbol di teks tampil" -f $emo) }
else { Add-Result 'PASS' 'Tanpa emoji' 'ok' }

# 9. Italic tanpa font italic
$ital = Count-Rx $raw '(?<!not-)\bitalic\b' $cs
$italLink = Count-Rx $raw 'ital[,@]' $ci
if (($ital -gt 0) -and ($italLink -eq 0)) { Add-Result 'WARN' 'Italic punya font italic' ("kelas italic x{0} tapi link font tanpa ital" -f $ital) }
else { Add-Result 'PASS' 'Italic punya font italic' 'ok' }

# 10. Kedalaman visual
$rad = Count-Rx $raw 'radial-gradient' $ci
$grid = Count-Rx $raw 'background-size:\s*48px' $ci
if (($rad -gt 0) -and ($grid -gt 0)) { Add-Result 'PASS' 'Kedalaman (gradien + grid)' 'keduanya ada' }
elseif (($rad + $grid) -gt 0) { Add-Result 'WARN' 'Kedalaman (gradien + grid)' ("radial {0}, grid {1}" -f $rad, $grid) }
else { Add-Result 'WARN' 'Kedalaman (gradien + grid)' 'tidak ada' }

# 11. Judul hero
$h1 = [regex]::Match($noComments, '<h1[^>]*>(.*?)</h1>', $ml)
if ($h1.Success) {
    $t = [regex]::Replace($h1.Groups[1].Value, '<[^>]+>', ' ')
    $t = [regex]::Replace($t, '\s+', ' ').Trim()
    $wc = @($t -split ' ').Count
    if ($wc -gt 8) { Add-Result 'FAIL' 'Judul hero singkat' ("{0} kata" -f $wc) }
    elseif ($wc -gt 6) { Add-Result 'WARN' 'Judul hero singkat' ("{0} kata (disarankan 6 atau kurang)" -f $wc) }
    else { Add-Result 'PASS' 'Judul hero singkat' ("{0} kata" -f $wc) }
}
else { Add-Result 'WARN' 'Judul hero singkat' 'h1 tidak ditemukan' }

# 12. Header harus berlatar sejak awal (V72-3). bg-transparent dihitung TIDAK berlatar.
$hdr = [regex]::Match($noComments, '<header\b[^>]*class="([^"]*)"', $ml)
if ($hdr.Success) {
    $hc = $hdr.Groups[1].Value
    $solid = [regex]::IsMatch($hc, '(^|\s)bg-[\w-]+(/(?!0(\s|$))\d+)?(\s|$)') -or [regex]::IsMatch($hc, '(^|\s)bg-\[')
    if ([regex]::IsMatch($hc, '(^|\s)bg-transparent(\s|$)')) { $solid = $false }
    if ($solid) { Add-Result 'PASS' 'Header punya latar sejak awal' 'ok' }
    else { Add-Result 'WARN' 'Header punya latar sejak awal' 'transparan di awal: cek teks header terbaca di atas hero' }
}
else { Add-Result 'WARN' 'Header punya latar sejak awal' 'tag header dengan class tidak ditemukan' }

# 13. Bobot font yang dipakai vs yang dimuat (heuristik kasar, hanya link font pertama)
$gf = [regex]::Match($raw, 'fonts\.googleapis\.com/css2\?[^"'']+', $ci)
if ($gf.Success) {
    $u = $gf.Value
    $miss = @()
    if (($raw -match 'font-bold') -and ($u -notmatch '700')) { $miss += 'font-bold(700)' }
    if (($raw -match 'font-semibold') -and ($u -notmatch '600')) { $miss += 'font-semibold(600)' }
    if (($raw -match 'font-medium') -and ($u -notmatch '500')) { $miss += 'font-medium(500)' }
    if ($miss.Count -gt 0) { Add-Result 'WARN' 'Bobot font dimuat' ('dipakai tapi tidak ada di link font: ' + ($miss -join ', ')) }
    else { Add-Result 'PASS' 'Bobot font dimuat' 'ok' }
}
else { Add-Result 'WARN' 'Bobot font dimuat' 'link Google Fonts tidak ditemukan' }

# 14. Pil status buka/tutup (V73-1): harus latar terang sendiri, teks gelap
$pillDark = Count-Rx $raw 'text-(green|red)-(700|800|900)' $ci
if ($pillDark -gt 0) { Add-Result 'WARN' 'Warna status buka/tutup' 'text-*-700/800/900 rawan tak terbaca (cek screenshot)' }
else { Add-Result 'PASS' 'Warna status buka/tutup' 'ok' }
$p1 = Count-Rx $raw 'bg-emerald-200' $ci
$p2 = Count-Rx $raw 'text-emerald-950' $ci
$p3 = Count-Rx $raw 'bg-amber-200' $ci
$p4 = Count-Rx $raw 'text-amber-950' $ci
if (($p1 -ge 1) -and ($p2 -ge 1) -and ($p3 -ge 1) -and ($p4 -ge 1)) { Add-Result 'PASS' 'Kelas pil status (V73-1)' 'emerald-200/950 dan amber-200/950 ada' }
else { Add-Result 'WARN' 'Kelas pil status (V73-1)' ("emerald-200 {0}, emerald-950 {1}, amber-200 {2}, amber-950 {3}; cek pil di browser" -f $p1, $p2, $p3, $p4) }

# 15. Aturan V7.2/V7.3: baris FACTS di DESIGN PLAN, tanpa italic
$fp = $raw.IndexOf('FACTS:', [StringComparison]::Ordinal)
if ($fp -ge 0) {
    Add-Result 'PASS' 'FACTS di DESIGN PLAN (V7.2)' 'ada'
    $fe = $raw.IndexOf('-->', $fp, [StringComparison]::Ordinal)
    if ($fe -lt 0) { $fe = [Math]::Min($raw.Length, $fp + 1500) }
    $facts = $raw.Substring($fp, $fe - $fp)
    if (($facts -match 'PRIMARY') -and ($facts -match 'ACCENT')) { Add-Result 'PASS' 'FACTS memuat PRIMARY/ACCENT (V73-6)' 'ada' }
    else { Add-Result 'WARN' 'FACTS memuat PRIMARY/ACCENT (V73-6)' 'PRIMARY atau ACCENT tidak ada di baris FACTS' }
    if (-not $ExpectMenu) {
        if ($facts -match 'NONE') { Add-Result 'PASS' 'FACTS menu NONE (brief tanpa menu)' 'ada' }
        else { Add-Result 'WARN' 'FACTS menu NONE (brief tanpa menu)' 'kata NONE tidak ada di FACTS' }
    }
}
else { Add-Result 'WARN' 'FACTS di DESIGN PLAN (V7.2)' 'tidak ada' }
$ital2 = Count-Rx $raw '(?<!not-)\bitalic\b' $cs
if ($ital2 -gt 0) { Add-Result 'WARN' 'Tanpa italic (V7.2)' ("kelas italic x{0}" -f $ital2) }
else { Add-Result 'PASS' 'Tanpa italic (V7.2)' 'ok' }

# 16. Teks hantu (V73-2): elemen aria-hidden yang berisi huruf/angka (watermark, inisial, jam samar)
$ghost = @()
foreach ($m in [regex]::Matches($noCode, 'aria-hidden="true"[^>]*>([^<]{2,})<', $ci)) {
    $g = $m.Groups[1].Value.Trim()
    if ($g -match '[A-Za-z0-9]{2,}') { $ghost += $g }
}
if ($ghost.Count -gt 0) { Add-Result 'WARN' 'Teks hantu (V73-2)' ("aria-hidden berisi teks: " + (($ghost | Select-Object -First 3) -join ' | ')) }
else { Add-Result 'PASS' 'Teks hantu (V73-2)' 'tidak ada aria-hidden berisi teks' }

# 17. Tautan peta (V73-7): query harus memuat angka (alamat lengkap), bukan nama kota saja
$mapCount = 0
$mapBad = @()
foreach ($m in [regex]::Matches($raw, 'href="([^"]*(?:google\.[a-z.]+/maps|maps\.google\.|goo\.gl/maps|maps\.app\.goo\.gl)[^"]*)"', $ci)) {
    $mapCount++
    $u2 = $m.Groups[1].Value.Replace('&amp;', '&')
    $q = [regex]::Match($u2, '[?&](?:query|q)=([^&]*)')
    if ($q.Success) {
        $dec = [uri]::UnescapeDataString(($q.Groups[1].Value -replace '\+', ' '))
        if ($dec -notmatch '\d') { $mapBad += $dec }
    }
}
if ($mapBad.Count -gt 0) { Add-Result 'FAIL' 'Tautan peta (V73-7)' ("query tanpa angka (nama kota saja?): " + (($mapBad | Select-Object -Unique) -join ' | ')) }
elseif ($mapCount -gt 0) { Add-Result 'PASS' 'Tautan peta (V73-7)' ("{0} tautan, query berisi alamat berangka" -f $mapCount) }
else { Add-Result 'PASS' 'Tautan peta (V73-7)' 'tidak ada tautan peta' }

# Tampilkan hasil
Write-Host ''
Write-Host ("File: " + $Path)
Write-Host ''
foreach ($r in $results) {
    $color = 'Red'
    if ($r.Status -eq 'PASS') { $color = 'Green' }
    elseif ($r.Status -eq 'WARN') { $color = 'Yellow' }
    Write-Host ("{0,-5} {1,-38} {2}" -f $r.Status, $r.Check, $r.Detail) -ForegroundColor $color
}
$nFail = @($results | Where-Object { $_.Status -eq 'FAIL' }).Count
$nWarn = @($results | Where-Object { $_.Status -eq 'WARN' }).Count
$nPass = @($results | Where-Object { $_.Status -eq 'PASS' }).Count
Write-Host ''
Write-Host ("Ringkas: PASS {0}, WARN {1}, FAIL {2}" -f $nPass, $nWarn, $nFail)
Write-Host 'Catatan: skrip hanya membaca teks HTML. Kontras, tata letak, animasi, dan teks yang dibuat lewat JavaScript (mis. isi pesan WhatsApp) tetap harus dilihat di browser.'
if ($nFail -gt 0) { exit 1 }
exit 0
