import { Moon, Sun, Download, Truck } from 'lucide-react'
import { useTheme }      from '../context/ThemeContext'
import { usePWAInstall } from '../utils/usePWAInstall'
import clsx from 'clsx'

export default function Navbar() {
  const { isDark, toggleTheme }            = useTheme()
  const { isInstallable, isStandalone, install } = usePWAInstall()

  return (
    <header className={clsx(
      'fixed top-0 left-0 right-0 z-40 h-16',
      'bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-xl',
      'border-b border-gray-200/60 dark:border-white/[0.06]',
      'flex items-center justify-between px-4 lg:px-6'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
          <Truck size={16} className="text-white" strokeWidth={2.5}/>
        </div>
        <div>
          <span className="font-display font-bold text-sm text-gray-900 dark:text-white leading-none block">
            TransInvoice
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none font-mono">
            Management System
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/*
          PWA Install Button
          - Shows only when browser fires `beforeinstallprompt` (i.e. not yet installed)
          - Hidden when running as installed standalone PWA (CSS class pwa-only-hidden + JS check)
          - Visible on ALL screen sizes (mobile + desktop)
        */}
        {isInstallable && !isStandalone && (
          <button
            onClick={install}
            className={clsx(
              'pwa-only-hidden install-pulse',
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
              'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
              'hover:opacity-90 active:scale-95 transition-all duration-150',
              'shadow-glow-sm'
            )}
          >
            <Download size={13} strokeWidth={2.5}/>
            <span>Install App</span>
          </button>
        )}

        {/* Dark/light toggle */}
        <button
          onClick={toggleTheme}
          className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
            'bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10',
            'text-gray-600 dark:text-gray-400'
          )}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16}/> : <Moon size={16}/>}
        </button>
      </div>
    </header>
  )
}