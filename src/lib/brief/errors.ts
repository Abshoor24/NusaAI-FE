/** Nama field brief yang punya pesan error; dipisah agar bisa dipakai bersama. */
export type BriefFieldName =
  | 'description'
  | 'title'
  | 'brandName'
  | 'audience'
  | 'extraNotes'
  | 'primaryColor'
  | 'accentColor'
  | 'whatsapp'
  | 'phone'
  | 'email'
  | 'address'
  | 'mapsUrl'
  | 'instagram'
  | 'openingHours'

export type BriefErrors = Partial<Record<BriefFieldName, string>>