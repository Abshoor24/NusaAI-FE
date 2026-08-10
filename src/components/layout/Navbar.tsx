import { Link } from '@tanstack/react-router'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
] as const

export function Navbar() {
  return (
    <header className="border-b border-gray-200">
      <nav className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link to="/" className="text-sm font-semibold text-gray-900">
          Frontend
        </Link>
        <ul className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                activeProps={{ className: 'text-gray-900 font-medium' }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}