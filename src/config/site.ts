export const siteConfig = {
  name: 'Your Brand',
  description: 'A short description of your brand, product, or service.',
  navItems: [
    { to: '/', label: 'Home', exact: true },
    { to: '/about', label: 'About', exact: false },
    { to: '/contact', label: 'Contact', exact: false },
    { to: '/ai-solution-generator', label: 'AI Solution Generator', exact: false },
    { to: '/chat', label: 'AI Chatbot', exact: false },
  ],
  socials: [] as Array<{ label: string; href: string }>,
  contact: {
    email: 'hello@example.com',
    address: 'Your address goes here.',
  },
} as const