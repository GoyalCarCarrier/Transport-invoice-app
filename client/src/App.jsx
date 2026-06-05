import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import AddEntry from './pages/AddEntry'
import InvoicePage from './pages/InvoicePage'
import { HistoryPage, SettingsPage } from './pages/OtherPages'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f1a]">
      <Navbar />
      <Sidebar />
      <main className="
        pt-16
        lg:pl-60
        pb-24 lg:pb-8
        px-4 lg:px-8
        min-h-screen
      ">
        <div className="max-w-7xl mx-auto py-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-entry" element={<AddEntry />} />
            <Route path="/invoices" element={<InvoicePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}