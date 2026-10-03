export const siteConfig = {
  name: 'Pakhir Studio',
  description: 'AI Website Generator — jelaskan website yang diinginkan, AI membuatnya, revisi lewat teks, unduh .html.',
  navItems: [
    { to: '/', label: 'Beranda', exact: true },
    { to: '/projects', label: 'Project', exact: false },
  ],
  socials: [] as Array<{ label: string; href: string }>,
  contact: {
    email: 'support@pakhirstudio.id',
    address: 'Jakarta, Indonesia',
  },
} as const
