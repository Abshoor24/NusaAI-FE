import { Check, Download, Monitor, Smartphone, Tablet } from 'lucide-react'

/**
 * Ilustrasi ruang kerja Pakhir (chat + pratinjau langsung) sesuai referensi
 * Figma. Sengaja statis dan `aria-hidden`: ini gambar produk, bukan UI yang
 * bisa dipakai. Tombol di dalamnya span bergaya (bukan <button>) supaya
 * tidak ada kontrol mati (R-26). Tautan "Buka Project Saya" yang asli ada di
 * Hero, di luar ilustrasi ini.
 */
export function StudioMockup() {
  return (
    <div className="studio" aria-hidden="true">
      <div className="studio-bar">
        <div className="studio-dots">
          <i />
          <i />
          <i />
        </div>
        <span className="studio-url">studio.pakhir.id/proyek/kopi-senja</span>
        <span className="studio-saved">
          <Check className="size-3.5" />
          Tersimpan
        </span>
      </div>

      <div className="studio-body">
        <div className="studio-chat">
          <div className="studio-chat-head">
            <span className="studio-chat-mark" />
            <span className="studio-chat-name">Pakhir</span>
            <span className="studio-chat-version">v2</span>
          </div>

          <p className="studio-chat-label">Permintaan awal</p>
          <p className="studio-chat-request">
            Buat landing page untuk kedai kopi lokal yang terasa hangat dan modern.
          </p>

          <div className="studio-bubble">
            <span className="studio-spark" />
            <p>Website sudah dibuat. Kamu bisa melihat hasilnya di pratinjau.</p>
          </div>
          <div className="studio-bubble studio-bubble-user">
            <p>Buat bagian menu lebih menonjol dan tambahkan testimoni.</p>
          </div>
          <div className="studio-bubble">
            <span className="studio-spark" />
            <p>Siap, versi baru sudah tersedia.</p>
          </div>
        </div>

        <div className="studio-preview">
          <div className="studio-preview-head">
            <span>Pratinjau langsung</span>
            <span className="studio-devices">
              <Smartphone className="size-4" />
              <Tablet className="size-4" />
              <Monitor className="size-4" />
            </span>
            <span className="studio-download">
              <Download className="size-4" />
              Unduh
            </span>
          </div>

          <div className="studio-canvas">
            <div className="studio-site">
              <div className="studio-site-nav">
                <span className="studio-site-brand">Ruang Seduh</span>
                <span className="studio-site-links">Menu&nbsp;&nbsp;Cerita&nbsp;&nbsp;Kunjungi</span>
                <span className="studio-site-order">Pesan meja</span>
              </div>
              <p className="studio-site-kicker">Kopi lokal • Purwokerto</p>
              <p className="studio-site-title">
                Tempat pulang,
                <br />
                dalam setiap seduhan.
              </p>
              <p className="studio-site-sub">
                Kopi pilihan, ruang yang tenang, dan cerita yang tumbuh dari meja ke meja.
              </p>
              <span className="studio-site-cta">Lihat menu</span>
              <div className="studio-site-photos">
                <span className="studio-photo studio-photo-a" />
                <span className="studio-photo studio-photo-b" />
                <span className="studio-photo studio-photo-c" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
