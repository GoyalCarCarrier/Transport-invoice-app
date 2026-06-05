import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw, AlertCircle, Trash2, PackageCheck,
  Moon, Sun, Database, FileText, HelpCircle,
  ArrowRight, Loader2, Clock, CheckCircle2, Pencil,
} from 'lucide-react'
import { entriesAPI } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { formatCurrency } from '../utils/calculateTotals'
import clsx from 'clsx'

function fmtDate(d) {
  if (!d) return null
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return null }
}

// ── HISTORY PAGE ──────────────────────────────────────────────────────────────
export function HistoryPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all') // 'all' | 'pending' | 'delivered'
  const [hasMore, setHasMore] = useState(true)
  const [page,    setPage]    = useState(1)
  const LIMIT = 30

  const load = useCallback(async (reset = false) => {
    setLoading(true); setError(null)
    try {
      const p   = reset ? 1 : page
      const res = await entriesAPI.getAll({ page: p, limit: LIMIT, search })
      const data = res.data || []
      setEntries(prev => reset ? data : [...prev, ...data])
      setHasMore(data.length === LIMIT)
      if (!reset) setPage(p + 1)
    } catch (e) { setError(e.message) }
    finally     { setLoading(false) }
  }, [page, search])

  useEffect(() => { setPage(1); load(true) }, [search])

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    try {
      await entriesAPI.delete(id)
      setEntries(p => p.filter(e => e._id !== id))
    } catch (e) { alert(e.message) }
  }

  // Apply filter tabs
  const visible = entries.filter(e => {
    if (filter === 'pending')   return !e.delivered && !e.dropDate
    if (filter === 'delivered') return e.delivered  || !!e.dropDate
    return true
  })

  const pendingCount   = entries.filter(e => !e.delivered && !e.dropDate).length
  const deliveredCount = entries.filter(e => e.delivered  || !!e.dropDate).length

  return (
    <div className="animate-fade-in space-y-4 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">History</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">All vehicle entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} disabled={loading}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-40">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => navigate('/add-entry')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm">
            + Add Entry
          </button>
        </div>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search vehicle, model, city…"
        className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-[#13131f] border border-gray-200 dark:border-white/[0.08] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all" />

      {/* Filter tabs + counts */}
      <div className="flex items-center gap-2">
        {[
          { key: 'all',       label: 'All',         count: entries.length },
          { key: 'pending',   label: 'Pending',     count: pendingCount,   dot: 'bg-amber-400' },
          { key: 'delivered', label: 'Delivered',   count: deliveredCount, dot: 'bg-emerald-400' },
        ].map(({ key, label, count, dot }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              filter === key
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]'
            )}>
            {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dot)} />}
            {label}
            <span className={clsx('rounded-full px-1.5 py-px text-[10px] font-bold',
              filter === key ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400')}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertCircle size={24} className="text-red-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button onClick={() => load(true)} className="text-xs text-indigo-500 font-semibold flex items-center gap-1">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {loading && entries.length === 0
            ? [...Array(8)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
            : visible.length === 0
            ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <span className="text-4xl">{filter === 'pending' ? '⏳' : filter === 'delivered' ? '✅' : '🚛'}</span>
                <p className="text-sm text-gray-400 dark:text-gray-600">
                  {filter === 'pending'   ? 'No pending entries' :
                   filter === 'delivered' ? 'No delivered entries yet' :
                   'No entries found'}
                </p>
              </div>
            )
            : visible.map((entry, idx) => {
                const isDelivered = entry.delivered || !!entry.dropDate
                return (
                  <div key={entry._id}
                    className={clsx(
                      'group bg-white dark:bg-[#13131f] rounded-2xl border transition-all duration-150',
                      isDelivered
                        ? 'border-emerald-100 dark:border-emerald-500/10'
                        : 'border-amber-100 dark:border-amber-500/10',
                      'hover:shadow-md hover:scale-[1.005]'
                    )}>
                    <div className="flex items-start p-4 gap-3">

                      {/* Status indicator */}
                      <div className={clsx(
                        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                        isDelivered
                          ? 'bg-emerald-50 dark:bg-emerald-500/10'
                          : 'bg-amber-50 dark:bg-amber-500/10'
                      )}>
                        {isDelivered
                          ? <CheckCircle2 size={18} className="text-emerald-500" />
                          : <Clock size={18} className="text-amber-500" />
                        }
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                            {entry.vehicleNo}
                          </span>
                          <span className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            isDelivered
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          )}>
                            {isDelivered ? '✓ Delivered' : '⏳ Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{entry.model}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600 mt-1 flex-wrap">
                          <span className="font-medium text-gray-600 dark:text-gray-400">{entry.from}</span>
                          <ArrowRight size={10} className="text-indigo-400 flex-shrink-0" />
                          <span className="font-medium text-gray-600 dark:text-gray-400">{entry.to}</span>
                          <span>·</span>
                          <span>Pickup: {fmtDate(entry.pickupDate) || '—'}</span>
                          {isDelivered && entry.dropDate && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-500 dark:text-emerald-600">
                                Drop: {fmtDate(entry.dropDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: freight + actions */}
                      <div className="flex flex-col items-end gap-2 ml-1 flex-shrink-0">
                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(entry.freight)}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Mark Delivered — only shown for pending */}
                          {!isDelivered && (
                            <button
                              onClick={() => navigate('/add-entry', { state: { entry, deliverMode: true } })}
                              title="Mark as Delivered"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors active:scale-95">
                              <PackageCheck size={12} />
                              <span className="hidden sm:inline">Deliver</span>
                            </button>
                          )}
                          {/* Edit */}
                          <button
                            onClick={() => navigate('/add-entry', { state: { entry } })}
                            title="Edit entry"
                            className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                            <Pencil size={12} />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(entry._id)}
                            title="Delete entry"
                            className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
          }

          {hasMore && !loading && (
            <button onClick={() => load(false)}
              className="w-full py-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] text-xs font-medium text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
              Load more
            </button>
          )}
          {loading && entries.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-indigo-500" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── SETTINGS PAGE ─────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { isDark, toggleTheme } = useTheme()

  const groups = [
    {
      title: 'Appearance',
      items: [{
        icon: isDark ? Moon : Sun,
        label: 'Dark Mode',
        desc:  'Switch between light and dark theme',
        action: (
          <button onClick={toggleTheme}
            className={clsx('w-12 h-6 rounded-full transition-all duration-300 relative', isDark ? 'bg-indigo-500' : 'bg-gray-300')}>
            <div className={clsx('w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300', isDark ? 'left-6' : 'left-0.5')} />
          </button>
        ),
      }],
    },
    {
      title: 'Company Info',
      items: [
        { icon: FileText,   label: 'Invoice Settings',  desc: 'Company name, GSTIN, bank details',      action: <span className="text-xs text-gray-400 dark:text-gray-600">Edit in server/utils/pdfGenerator.js</span> },
        { icon: Database,   label: 'MongoDB Atlas',     desc: 'Connected via VITE_API_URL environment',  action: <span className="text-xs text-emerald-500 font-semibold">● Connected</span> },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help', desc: 'Documentation and setup guide', action: null },
      ],
    },
  ]

  return (
    <div className="animate-fade-in max-w-xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">App preferences and configuration</p>
      </div>
      {groups.map(g => (
        <div key={g.title} className="bg-white dark:bg-[#13131f] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-5 pt-4 pb-2">{g.title}</p>
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {g.items.map(item => (
              <div key={item.label} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
                    <item.icon size={15} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-600">{item.desc}</p>
                  </div>
                </div>
                {item.action}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
        TransInvoice v1.0.0 · Goyal Car Carrier · GST Ready
      </p>
    </div>
  )
}