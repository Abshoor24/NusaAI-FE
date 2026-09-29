export const siteConfig = {
  name: 'nusaAI Platform',
  description: 'AI Generator platform with Gemini LLM, RAG documents knowledge base, and Judge0 code sandbox.',
  navItems: [
    { to: '/', label: 'Home', exact: true },
    { to: '/chat', label: 'Chat', exact: false },
    { to: '/documents', label: 'Documents', exact: false },
  ],
  socials: [] as Array<{ label: string; href: string }>,
  contact: {
    email: 'support@nusaai.com',
    address: 'Jakarta, Indonesia',
  },
} as const