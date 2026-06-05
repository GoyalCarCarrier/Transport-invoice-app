import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, FileText, History, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/add-entry', icon: PlusCircle, label: 'Add' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className={clsx(
      'lg:hidden fixed bottom-0 left-0 right-0 z-40',
      'bg-white/90 dark:bg-[#0f0f1a]/90 backdrop-blur-xl',
      'border-t border-gray-200/60 dark:border-white/[0.06]',
      'bottom-nav'
    )}>
      <div className="flex items-center">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center gap-1 py-2.5 transition-all duration-200',
              isActive
                ? 'text-indigo-500 dark:text-indigo-400'
                : 'text-gray-400 dark:text-gray-600'
            )}
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                  isActive
                    ? 'bg-indigo-500/10 dark:bg-indigo-500/20'
                    : 'bg-transparent'
                )}>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span className={clsx(
                  'text-[10px] font-medium leading-none',
                  isActive ? 'opacity-100' : 'opacity-60'
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
