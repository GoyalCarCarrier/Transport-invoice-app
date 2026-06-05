import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

export default function StatsCard({ title, value, subtitle, icon: Icon, gradient, growth, loading }) {
  if (loading) {
    return (
      <div className="skeleton rounded-2xl h-36" />
    )
  }

  const isPositive = growth >= 0

  return (
    <div className={clsx(
      'group relative overflow-hidden rounded-2xl p-5 cursor-default',
      'transition-all duration-300',
      'hover:scale-[1.02] hover:shadow-xl',
      gradient
    )}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
          <Icon size={20} className="text-white" strokeWidth={2} />
        </div>

        {/* Value */}
        <p className="font-display text-2xl font-bold text-white leading-none mb-1 font-num">
          {value}
        </p>

        {/* Title */}
        <p className="text-white/70 text-xs font-medium mb-3">{title}</p>

        {/* Growth badge */}
        {growth !== undefined && (
          <div className={clsx(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
            isPositive
              ? 'bg-white/20 text-white'
              : 'bg-red-500/30 text-red-100'
          )}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isPositive ? '+' : ''}{growth}% vs last month
          </div>
        )}
      </div>
    </div>
  )
}
