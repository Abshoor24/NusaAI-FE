export const siteConfig = {
  name: 'Nusa AI',
  description: 'Nusa AI: jelaskan website yang diinginkan, lalu AI membuatnya.',
  navItems: [
    { to: '/', label: 'Beranda', exact: true },
    { to: '/projects', label: 'Project', exact: false },
  ],
  socials: [] as Array<{ label: string; href: string }>,
  contact: {
    email: 'muhammadnurulabshoor24@gmail.com',
    address: 'Purwokerto, Indonesia',
  },
} as const
