// App.tsx — router + providers
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import CreateRequestPage from './pages/CreateRequestPage'
import RequestPage from './pages/RequestPage'
import './i18n'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="bg-app min-h-dvh flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateRequestPage />} />
              <Route path="/r/:id" element={<RequestPage />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontWeight: 600,
            },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  )
}
