import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  History,
  Settings,
  Truck,
  ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/add-entry', icon: PlusCircle, label: 'Add Entry' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className={clsx(
      'hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-60',
      'bg-white/60 dark:bg-[#13131f]/60 backdrop-blur-xl',
      'border-r border-gray-200/60 dark:border-white/[0.06]',
      'pt-6 pb-8 px-3 z-30 custom-scrollbar overflow-y-auto'
    )}>
      {/* Nav group */}
      <div className="space-y-0.5 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 mb-3">
          Navigation
        </p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => clsx(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom branding */}
      <div className="mt-6 mx-1 p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-200/30 dark:border-indigo-500/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Truck size={12} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">TransInvoice</span>
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-relaxed">
          v1.0.0 · GST Ready · PDF Export
        </p>
      </div>
    </aside>
  )
}
