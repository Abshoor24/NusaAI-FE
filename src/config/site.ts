export const siteConfig = {
  name: 'Pakhir Studio',
  description: 'Pakhir Studio: jelaskan website yang diinginkan, lalu AI membuatnya.',
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
