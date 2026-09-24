export const siteConfig = {
  name: 'nusaAI Platform',
  description: 'AI Generator platform with Gemini, RAG documents, and Judge0 code sandbox.',
  navItems: [
    { to: '/', label: 'Home', exact: true },
    { to: '/chat', label: 'Chat', exact: false },
    { to: '/documents', label: 'Documents', exact: false },
    { to: '/sandbox', label: 'Sandbox', exact: false },
    { to: '/about', label: 'About', exact: false },
    { to: '/contact', label: 'Contact', exact: false },
  ],
  socials: [] as Array<{ label: string; href: string }>,
  contact: {
    email: 'hello@example.com',
    address: 'Your address goes here.',
  },
} as const