import { Pencil, Trash2, ArrowRight, PackageCheck, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '../utils/calculateTotals'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="skeleton h-4 rounded-md w-full" />
        </td>
      ))}
    </tr>
  )
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={8} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center">
            <span className="text-3xl">🚛</span>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No entries yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-600">Add your first vehicle entry to get started</p>
        </div>
      </td>
    </tr>
  )
}

function fmt(d) {
  try { return format(new Date(d), 'dd MMM yy') } catch { return '—' }
}

export default function Table({ entries = [], loading, onDelete }) {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/[0.06]">
            {['S.No', 'Vehicle No', 'Model', 'Route', 'Pickup', 'Drop', 'Freight', 'Status', 'Actions'].map(col => (
              <th key={col} className="text-left text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-600 px-3 py-3 first:pl-0 last:pr-0">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          {!loading && entries.length === 0 && <EmptyState />}
          {!loading && entries.map((entry, idx) => {
            const isDelivered = entry.delivered || !!entry.dropDate
            return (
              <tr key={entry._id}
                className={clsx(
                  'group border-b border-gray-50 dark:border-white/[0.03] transition-colors duration-150',
                  'hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.04]',
                  idx % 2 !== 0 && 'bg-gray-50/40 dark:bg-white/[0.01]'
                )}>
                {/* S.No */}
                <td className="px-3 py-3 pl-0">
                  <span className="font-mono text-xs text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-md">
                    {String(entry.sNo || idx + 1).padStart(2, '0')}
                  </span>
                </td>
                {/* Vehicle No */}
                <td className="px-3 py-3">
                  <span className="font-mono text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg">
                    {entry.vehicleNo}
                  </span>
                </td>
                {/* Model */}
                <td className="px-3 py-3 text-gray-700 dark:text-gray-300 font-medium text-xs">{entry.model}</td>
                {/* Route */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{entry.from}</span>
                    <ArrowRight size={10} className="text-indigo-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{entry.to}</span>
                  </div>
                </td>
                {/* Pickup */}
                <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-500 font-mono">{fmt(entry.pickupDate)}</td>
                {/* Drop */}
                <td className="px-3 py-3 text-xs font-mono">
                  {entry.dropDate
                    ? <span className="text-emerald-600 dark:text-emerald-400">{fmt(entry.dropDate)}</span>
                    : <span className="text-gray-300 dark:text-gray-600 italic">not set</span>
                  }
                </td>
                {/* Freight */}
                <td className="px-3 py-3">
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(entry.freight)}
                  </span>
                </td>
                {/* Status badge */}
                <td className="px-3 py-3">
                  {isDelivered
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={10} /> Done
                      </span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock size={10} /> Pending
                      </span>
                  }
                </td>
                {/* Actions */}
                <td className="px-3 py-3 pr-0">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {/* Mark Delivered — only if not yet delivered */}
                    {!isDelivered && (
                      <button
                        onClick={() => navigate('/add-entry', { state: { entry, deliverMode: true } })}
                        title="Mark as delivered"
                        className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                        <PackageCheck size={12} />
                      </button>
                    )}
                    {/* Edit */}
                    <button
                      onClick={() => navigate('/add-entry', { state: { entry } })}
                      title="Edit"
                      className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                      <Pencil size={13} />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => onDelete?.(entry._id)}
                      title="Delete"
                      className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}