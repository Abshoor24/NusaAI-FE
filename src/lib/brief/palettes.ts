/**
 * Palet warna siap pakai. Nama dalam bahasa sehari-hari; nilai hex ikut
 * dikirim ke AI lewat color_palette (bersama nama warna hasil describeColor).
 */
export interface PalettePreset {
  id: string
  label: string
  primary: string
  accent: string
}

export const PALETTE_PRESETS: PalettePreset[] = [
  { id: 'hangat', label: 'Hangat', primary: '#6F4E37', accent: '#F5E6D3' },
  { id: 'segar', label: 'Segar', primary: '#0F766E', accent: '#BBF7D0' },
  { id: 'elegan', label: 'Elegan', primary: '#1E3A8A', accent: '#DDD6FE' },
  { id: 'ceria', label: 'Ceria', primary: '#DC2626', accent: '#FBCFE8' },
  { id: 'gelap-mewah', label: 'Gelap mewah', primary: '#111111', accent: '#D4AF37' },
  { id: 'netral', label: 'Netral', primary: '#4B5563', accent: '#E8DCC8' },
  { id: 'alam', label: 'Alam', primary: '#3F6212', accent: '#FFF7ED' },
  { id: 'pastel', label: 'Pastel', primary: '#BAE6FD', accent: '#FBCFE8' },
]