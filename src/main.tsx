import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './App'

const storedTheme = window.localStorage.getItem('theme')
const initialTheme = storedTheme === 'light' ? 'light' : 'dark'
document.documentElement.classList.toggle('dark', initialTheme === 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)