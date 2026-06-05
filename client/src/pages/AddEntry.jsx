import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Save, Truck, Loader2, AlertCircle,
  CheckCircle2, MapPin, IndianRupee, PackageCheck,
} from 'lucide-react'
import { entriesAPI } from '../services/api'
import clsx from 'clsx'

// ── shared styles ─────────────────────────────────────────────────────────────
const ic = clsx(
  'w-full px-3.5 py-2.5 rounded-xl text-sm',
  'bg-gray-50 dark:bg-white/[0.04]',
  'border border-gray-200 dark:border-white/[0.08]',
  'text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600',
  'focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60',
  'focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200'
)

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}

function SectionCard({ icon: Icon, title, subtitle, gradient, children }) {
  const gradients = {
    indigo:  'from-indigo-500 to-purple-600',
    amber:   'from-amber-500 to-orange-500',
    emerald: 'from-emerald-500 to-teal-600',
  }
  return (
    <div className="bg-white dark:bg-[#13131f] rounded-2xl p-6 border border-gray-100 dark:border-white/[0.06] shadow-card dark:shadow-card-dark space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
        <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', gradients[gradient || 'indigo'])}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function AddEntry() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const editEntry  = location.state?.entry
  // deliverMode = coming from History "Mark Delivered" button
  const deliverMode = location.state?.deliverMode === true

  const [form, setForm] = useState({
    vehicleNo:  editEntry?.vehicleNo  || '',
    model:      editEntry?.model      || '',
    from:       editEntry?.from       || '',
    to:         editEntry?.to         || '',
    pickupDate: editEntry?.pickupDate ? editEntry.pickupDate.slice(0, 10) : '',
    freight:    editEntry?.freight    || '',
    dropDate:   editEntry?.dropDate   ? editEntry.dropDate.slice(0, 10)   : '',
  })

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(false)

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      if (deliverMode && editEntry) {
        // Only patch dropDate + mark delivered
        if (!form.dropDate) { setError('Please enter the delivery date'); setSaving(false); return }
        await entriesAPI.update(editEntry._id, { dropDate: form.dropDate, delivered: true })
      } else if (editEntry) {
        // Full edit — include dropDate only if filled
        const payload = {
          vehicleNo:  form.vehicleNo,
          model:      form.model,
          from:       form.from,
          to:         form.to,
          pickupDate: form.pickupDate,
          freight:    form.freight,
        }
        if (form.dropDate) { payload.dropDate = form.dropDate; payload.delivered = true }
        await entriesAPI.update(editEntry._id, payload)
      } else {
        // New entry — dropDate NOT sent (added after delivery)
        await entriesAPI.create({
          vehicleNo:  form.vehicleNo,
          model:      form.model,
          from:       form.from,
          to:         form.to,
          pickupDate: form.pickupDate,
          freight:    form.freight,
        })
      }
      setSuccess(true)
      setTimeout(() => navigate('/history'), 900)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── DELIVER MODE ─────────────────────────────────────────────────────────────
  // Minimal focused screen: just the drop date for this one vehicle
  if (deliverMode && editEntry) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white">Mark as Delivered</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Enter the drop date — vehicle has been delivered</p>
          </div>
        </div>

        {/* Vehicle summary */}
        <div className="bg-indigo-50 dark:bg-indigo-500/[0.08] rounded-2xl p-4 border border-indigo-100 dark:border-indigo-500/20 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <p className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-300">{editEntry.vehicleNo}</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400">{editEntry.model} · {editEntry.from} → {editEntry.to}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-indigo-200/50 dark:border-indigo-500/20 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-indigo-400 dark:text-indigo-500">Pickup Date</p>
              <p className="font-semibold text-indigo-700 dark:text-indigo-300 mt-0.5">
                {editEntry.pickupDate ? new Date(editEntry.pickupDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
              </p>
            </div>
            <div>
              <p className="text-indigo-400 dark:text-indigo-500">Freight</p>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{Number(editEntry.freight).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle2 size={15} /> Delivery date saved! Going back…
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <SectionCard icon={PackageCheck} title="Delivery Confirmation" subtitle="When was this vehicle delivered?" gradient="emerald">
            <Field label="Drop / Delivery Date" required hint="Enter the actual date this vehicle reached its destination">
              <input name="dropDate" type="date" value={form.dropDate} onChange={set}
                className={ic} required max={new Date().toISOString().slice(0, 10)} />
            </Field>
          </SectionCard>

          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || success}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shadow-sm">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {saving ? 'Saving…' : 'Confirm Delivery'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── NEW ENTRY or FULL EDIT ────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white">
            {editEntry ? 'Edit Entry' : 'New Vehicle Entry'}
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {editEntry ? 'Update vehicle transport details' : 'Add vehicle · Drop date can be added after delivery'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <CheckCircle2 size={15} /> Entry {editEntry ? 'updated' : 'saved'}! Redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Section 1 — Vehicle */}
        <SectionCard icon={Truck} title="Vehicle Details" subtitle="Vehicle number and model">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vehicle Number" required>
              <input name="vehicleNo" value={form.vehicleNo} onChange={set}
                placeholder="MH-12-AB-1234" className={ic} required />
            </Field>
            <Field label="Vehicle Model" required>
              <input name="model" value={form.model} onChange={set}
                placeholder="Maruti Suzuki Swift" className={ic} required />
            </Field>
          </div>
        </SectionCard>

        {/* Section 2 — Route & Pickup */}
        <SectionCard icon={MapPin} title="Route & Pickup" subtitle="Transport route and pickup date" gradient="amber">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="From (City)" required>
              <input name="from" value={form.from} onChange={set} placeholder="Mumbai" className={ic} required />
            </Field>
            <Field label="To (City)" required>
              <input name="to" value={form.to} onChange={set} placeholder="Bangalore" className={ic} required />
            </Field>
            <Field label="Pickup Date" required>
              <input name="pickupDate" type="date" value={form.pickupDate} onChange={set} className={ic} required />
            </Field>
          </div>
        </SectionCard>

        {/* Section 3 — Freight */}
        <SectionCard icon={IndianRupee} title="Freight Amount" subtitle="Transport charges for this vehicle" gradient="emerald">
          <Field label="Freight Amount (₹)" required>
            <input name="freight" type="number" min="0" value={form.freight} onChange={set}
              placeholder="9500" className={ic + ' font-mono'} required />
          </Field>
        </SectionCard>

        {/* Section 4 — Drop Date — only shown when EDITING */}
        {editEntry && (
          <SectionCard icon={PackageCheck} title="Delivery Info" subtitle="Fill this only after the vehicle is delivered" gradient="emerald">
            <Field label="Drop / Delivery Date" hint="Leave blank if vehicle hasn't been delivered yet">
              <input name="dropDate" type="date" value={form.dropDate} onChange={set} className={ic} />
            </Field>
            {form.dropDate && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 size={13} /> Vehicle will be marked as delivered
              </div>
            )}
          </SectionCard>
        )}

        {/* Info banner for new entries */}
        {!editEntry && (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
            <PackageCheck size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Drop date added after delivery</p>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                Once the vehicle is delivered, open <strong>History</strong> and tap the green <strong>"Mark Delivered"</strong> button to enter the drop date.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || success}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shadow-glow-sm">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : editEntry ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </form>
    </div>
  )
}