import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck, IndianRupee, FileText, TrendingUp,
  PlusCircle, Zap, Search,
  ChevronRight, ArrowUpRight, AlertCircle, RefreshCw,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import StatsCard     from '../components/StatsCard'
import Table         from '../components/Table'
import { formatCurrencyCompact, formatCurrency } from '../utils/calculateTotals'
import { entriesAPI, invoicesAPI } from '../services/api'
import { useTheme }    from '../context/ThemeContext'
import clsx from 'clsx'

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name === 'revenue' ? formatCurrency(p.value) : `${p.value} vehicles`}
        </p>
      ))}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    paid:    'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    pending: 'bg-amber-50  dark:bg-amber-500/10  text-amber-600  dark:text-amber-400',
    draft:   'bg-gray-100  dark:bg-white/[0.06]  text-gray-500   dark:text-gray-500',
  }
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide', map[status] || map.draft)}>
      {status}
    </span>
  )
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Failed to load data</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs text-center">{message}</p>
      <button onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { isDark }  = useTheme()
  const navigate    = useNavigate()

  const [entries,  setEntries]  = useState([])
  const [invoices, setInvoices] = useState([])
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [activeChart, setActiveChart] = useState('revenue')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [eRes, iRes, sRes] = await Promise.all([
        entriesAPI.getAll({ limit: 10, sort: '-createdAt' }),
        invoicesAPI.getAll(),
        entriesAPI.stats(),
      ])
      setEntries(eRes.data  || [])
      setInvoices((iRes.data || []).slice(0, 3))
      setStats(sRes.data || null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = entries.filter(e =>
    !search ||
    e.vehicleNo?.toLowerCase().includes(search.toLowerCase()) ||
    e.model?.toLowerCase().includes(search.toLowerCase()) ||
    e.from?.toLowerCase().includes(search.toLowerCase()) ||
    e.to?.toLowerCase().includes(search.toLowerCase())
  )

  const statsCards = [
    {
      title: 'Total Vehicles',
      value: loading ? '—' : (stats?.totalVehicles ?? entries.length),
      icon: Truck,
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      growth: stats?.vehiclesGrowth,
    },
    {
      title: 'Total Freight',
      value: loading ? '—' : formatCurrencyCompact(stats?.totalFreight ?? 0),
      icon: IndianRupee,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      growth: stats?.freightGrowth,
    },
    {
      title: 'Total Invoices',
      value: loading ? '—' : (stats?.totalInvoices ?? invoices.length),
      icon: FileText,
      gradient: 'bg-gradient-to-br from-orange-500 to-rose-500',
      growth: stats?.invoicesGrowth,
    },
    {
      title: 'Monthly Revenue',
      value: loading ? '—' : formatCurrencyCompact(stats?.monthlyRevenue ?? 0),
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      growth: stats?.revenueGrowth,
    },
  ]

  const chartData = stats?.monthlyChart || []
  const cc = isDark
    ? { line: '#818cf8', bar: '#6366f1', grid: 'rgba(255,255,255,0.05)', text: '#6b7280' }
    : { line: '#6366f1', bar: '#6366f1', grid: 'rgba(0,0,0,0.04)',       text: '#9ca3af' }

  return (
    <div className="space-y-6 animate-fade-in pb-4">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-40">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => navigate('/add-entry')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm">
            <PlusCircle size={16} />
            <span className="hidden sm:inline">Add Entry</span>
          </button>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {statsCards.map(c => <StatsCard key={c.title} {...c} loading={loading} />)}
          </div>

          {/* Charts + Recent Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-[#13131f] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] shadow-card dark:shadow-card-dark">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-gray-900 dark:text-white">Performance Overview</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Last 6 months</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.04] rounded-xl p-1">
                  {['revenue','vehicles'].map(tab => (
                    <button key={tab} onClick={() => setActiveChart(tab)}
                      className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize',
                        activeChart===tab
                          ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[200px]">
                {loading ? <div className="skeleton w-full h-full rounded-xl" /> :
                  chartData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-xs text-gray-400 dark:text-gray-600">No chart data yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === 'revenue' ? (
                        <AreaChart data={chartData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                          <defs>
                            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize:11, fill:cc.text }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={v=>`₹${v/1000}K`} tick={{ fontSize:10, fill:cc.text }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip content={<ChartTip />} />
                          <Area type="monotone" dataKey="revenue" name="revenue" stroke={cc.line} strokeWidth={2} fill="url(#rg)" dot={false} activeDot={{ r:4, fill:'#6366f1' }} />
                        </AreaChart>
                      ) : (
                        <BarChart data={chartData} margin={{ top:5, right:5, bottom:0, left:0 }} barSize={24}>
                          <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize:11, fill:cc.text }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize:10, fill:cc.text }} axisLine={false} tickLine={false} width={25} />
                          <Tooltip content={<ChartTip />} />
                          <Bar dataKey="vehicles" name="vehicles" fill={cc.bar} radius={[6,6,0,0]} opacity={0.85} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  )
                }
              </div>
            </div>

            {/* Recent invoices */}
            <div className="bg-white dark:bg-[#13131f] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] shadow-card dark:shadow-card-dark">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-gray-900 dark:text-white">Recent Invoices</h2>
                <button onClick={() => navigate('/invoices')}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors">
                  View all <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {loading ? [...Array(3)].map((_,i) => <div key={i} className="skeleton h-14 rounded-xl" />) :
                  invoices.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2">
                      <span className="text-3xl">🧾</span>
                      <p className="text-xs text-gray-400 dark:text-gray-600">No invoices yet</p>
                    </div>
                  ) : invoices.map(inv => (
                    <div key={inv._id}
                      className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.05] transition-colors cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/10"
                      onClick={() => navigate('/invoices')}>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{inv.invoiceNo}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 truncate mt-0.5">{inv.customer?.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{formatCurrencyCompact(inv.grandTotal)}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))
                }
              </div>
              <button onClick={() => navigate('/invoices')}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] text-xs font-medium text-gray-400 dark:text-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:text-indigo-500 transition-all duration-200">
                <Zap size={13} /> Generate New Invoice
              </button>
            </div>
          </div>

          {/* Entries table */}
          <div className="bg-white dark:bg-[#13131f] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] shadow-card dark:shadow-card-dark">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display text-base font-semibold text-gray-900 dark:text-white">Recent Entries</h2>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                  {loading ? '…' : `${entries.length} loaded`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search vehicle, route…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full sm:w-52 pl-8 pr-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all" />
                </div>
                <button onClick={() => navigate('/add-entry')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95 transition-all">
                  <PlusCircle size={13} /> Add Entry
                </button>
              </div>
            </div>
            <Table entries={filtered} loading={loading}
              onEdit={entry => navigate('/add-entry', { state: { entry } })}
              onDelete={async (id) => {
                if (!confirm('Delete this entry?')) return
                await entriesAPI.delete(id)
                setEntries(p => p.filter(e => e._id !== id))
              }}
            />
            {!loading && entries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/[0.04] flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-600">Showing {filtered.length} of {entries.length} entries</p>
                <button onClick={() => navigate('/history')}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors">
                  View all <ArrowUpRight size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile quick actions */}
          <div className="grid grid-cols-2 gap-3 sm:hidden">
            <button onClick={() => navigate('/add-entry')}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-glow-sm active:scale-95 transition-all">
              <PlusCircle size={18} /> Add Entry
            </button>
            <button onClick={() => navigate('/invoices')}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white dark:bg-[#13131f] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 text-sm font-semibold active:scale-95 transition-all">
              <Zap size={18} className="text-indigo-500" /> Invoice
            </button>
          </div>
        </>
      )}
    </div>
  )
}