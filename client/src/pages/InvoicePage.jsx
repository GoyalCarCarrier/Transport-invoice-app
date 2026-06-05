import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Download, Eye, X, ArrowLeft,
  Calendar, Hash, Building2, MapPin, CreditCard,
  Loader2, AlertCircle, RefreshCw, Trash2,
  Search, SlidersHorizontal, ChevronDown, ChevronUp,
} from 'lucide-react'
import { entriesAPI, invoicesAPI } from '../services/api'
import { numberToWords }            from '../utils/numberToWords'
import clsx from 'clsx'

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt2 = n =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmtDate(d) {
  if (!d) return ''
  try {
    const dt = new Date(d)
    return `${String(dt.getDate()).padStart(2,'0')}-${String(dt.getMonth()+1).padStart(2,'0')}-${dt.getFullYear()}`
  } catch { return d }
}

// ── Company config (must match pdfGenerator.js) ───────────────────────────────
const CO = {
  name:'GOYAL CAR CARRIER', gstin:'06BSNPA6680A1ZY', mobile:'+91-9050909027',
  website:'www.goyalcarcarrier.com',
  address:'2428 Ward No 13, Vikas Nagar, Near Telephone Exchange, Tosham - 127040',
  hsnCode:'9965', stateCode:'06', bank:'HDFC Bank', accNo:'50200106550709',
  ifsc:'HDFC0002923', swift:'HDFCINBB',
}


// ── Build exact invoice HTML (client-side, for preview) ───────────────────────
function buildInvoiceHTML(invoice, logoBase64) {
  const entries  = invoice.entries || []
  const gstRate  = invoice.gstRate || 18
  const subtotal = entries.reduce((s,e)=>s+Number(e.freight||0),0)
  const gstAmt   = Math.round(subtotal*gstRate/100*100)/100
  const grand    = subtotal+gstAmt

  const th = `<tr style="background:#111;color:#fff;">
    <th style="padding:6px 4px;border:1px solid #333;text-align:center;width:32px;font-size:10px;">S.No</th>
    <th style="padding:6px 4px;border:1px solid #333;text-align:left;width:86px;font-size:10px;">Vehicle No</th>
    <th style="padding:6px 4px;border:1px solid #333;text-align:left;font-size:10px;">Model</th>
    <th style="padding:6px 4px;border:1px solid #333;text-align:left;width:70px;font-size:10px;">From</th>
    <th style="padding:6px 4px;border:1px solid #333;text-align:left;width:70px;font-size:10px;">To</th>
    <th style="padding:6px 4px;border:1px solid #333;text-align:center;width:68px;font-size:10px;">Pickup<br/>Date</th>
    <th style="padding:6px 4px;border:1px solid #333;text-align:center;width:68px;font-size:10px;">Drop Date</th>
    <th style="padding:6px 4px;border:1px solid #333;text-align:right;width:62px;font-size:10px;">Freight</th>
  </tr>`

  const eRow = (e, sNo, idx) => {
    const bg = idx%2===0?'#fff':'#f9f9f9'
    return `<tr style="background:${bg};">
      <td style="padding:4px 4px;border:1px solid #ccc;text-align:center;font-size:10px;">${sNo}</td>
      <td style="padding:4px 4px;border:1px solid #ccc;font-weight:700;font-size:9.5px;white-space:nowrap;">${e.vehicleNo||''}</td>
      <td style="padding:4px 4px;border:1px solid #ccc;font-size:10px;">${e.model||''}</td>
      <td style="padding:4px 4px;border:1px solid #ccc;font-size:10px;">${e.from||''}</td>
      <td style="padding:4px 4px;border:1px solid #ccc;font-size:10px;">${e.to||''}</td>
      <td style="padding:4px 4px;border:1px solid #ccc;text-align:center;font-size:10px;white-space:nowrap;">${fmtDate(e.pickupDate)}</td>
      <td style="padding:4px 4px;border:1px solid #ccc;text-align:center;font-size:10px;white-space:nowrap;">${fmtDate(e.dropDate)}</td>
      <td style="padding:4px 4px;border:1px solid #ccc;text-align:right;font-weight:700;font-size:10px;">${Number(e.freight||0).toLocaleString('en-IN')}</td>
    </tr>`
  }

  const logoTag = logoBase64
    ? `<img src="${logoBase64}" style="width:88px;height:auto;display:block;"/>`
    : `<div style="border:2px solid #1a3a6e;padding:5px 8px;text-align:center;display:inline-block;"><div style="font-size:20px;font-weight:900;color:#1a3a6e;letter-spacing:-1px;line-height:1;">GCC</div><div style="font-size:7px;color:#1a3a6e;font-weight:700;margin-top:2px;">GOYAL CAR CARRIER</div></div>`

  const rows = entries.map((e, i) => eRow(e, i+1, i)).join('')

  const pgFooter = `
    <div style="display:flex;justify-content:flex-end;margin-top:0;">
      <table style="border-collapse:collapse;width:310px;">
        <tr><td style="border:1px solid #333;padding:4px 10px;font-weight:700;font-size:11px;">SUB TOTAL :</td><td style="border:1px solid #333;border-left:none;padding:4px 10px;text-align:right;font-weight:700;font-size:11px;">${fmt2(subtotal)}</td></tr>
        <tr><td style="border:1px solid #333;border-top:none;padding:4px 10px;font-weight:700;font-size:11px;">IGST @${gstRate}% :</td><td style="border:1px solid #333;border-left:none;border-top:none;padding:4px 10px;text-align:right;font-weight:700;font-size:11px;">${fmt2(gstAmt)}</td></tr>
        <tr style="background:#111;color:#fff;"><td style="border:1px solid #333;padding:5px 10px;font-weight:700;font-size:12px;">GRAND TOTAL :</td><td style="border:1px solid #333;border-left:none;padding:5px 10px;text-align:right;font-weight:700;font-size:12px;">${fmt2(grand)}</td></tr>
      </table>
    </div>
    <div style="border:1px solid #333;padding:5px 10px;font-size:10px;margin-top:4px;"><b>BILL AMOUNT IN WORDS : </b><span style="font-style:italic;">${numberToWords(grand)}</span></div>
    <div style="display:flex;gap:10px;margin-top:8px;align-items:flex-start;">
      <div style="flex:1;border:1px solid #333;padding:7px 10px;font-size:10px;">
        <div style="font-weight:700;margin-bottom:5px;">BANK DETAILS</div>
        <table style="border-collapse:collapse;width:100%;"><tr>
          <td style="font-size:9.5px;padding:1px 8px 1px 0;"><b>Bank Name:</b> ${CO.bank}</td>
          <td style="font-size:9.5px;padding:1px 8px;"><b>Bank A/c No:</b> ${CO.accNo}</td>
          <td style="font-size:9.5px;padding:1px 8px;"><b>IFSC Code:</b> ${CO.ifsc}</td>
          <td style="font-size:9.5px;padding:1px 0;"><b>SWIFT Code:</b> ${CO.swift}</td>
        </tr></table>
      </div>
      <div style="min-width:150px;text-align:right;padding-top:2px;">
        <div style="font-weight:700;font-size:10px;">For ${CO.name}</div>
        <div style="height:38px;"></div>
        <div style="border-top:1px solid #333;padding-top:3px;font-size:10px;">(Authorised Signatory)</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:8px;font-size:9px;color:#555;font-style:italic;">This is a computer generated invoice and doesn't require any signature</div>`

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
table{border-collapse:collapse;}
thead{display:table-header-group;}
tfoot{display:table-footer-group;}
tr{page-break-inside:avoid;}
@page{size:A4;margin:12mm 15mm;}
</style>
</head><body>
<div style="text-align:center;font-size:17px;font-weight:900;letter-spacing:3px;margin-bottom:7px;">INVOICE</div>
<table style="width:100%;border-collapse:collapse;border:1px solid #333;">
  <tr>
    <td style="width:150px;padding:5px 8px;vertical-align:middle;border-right:1px solid #333;">${logoTag}
      <div style="font-size:12px;font-weight:900;color:#111;margin-top:4px;">${CO.name}</div>
      <div style="font-size:9px;font-weight:700;margin-top:1px;">GSTIN : ${CO.gstin}</div>
    </td>
    <td style="padding:5px 8px;vertical-align:middle;text-align:center;">
      <div style="font-size:10px;font-weight:700;">Mobile: ${CO.mobile} | Website: ${CO.website}</div>
      <div style="font-size:9px;margin-top:3px;">Registered Address: ${CO.address}</div>
    </td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:1px solid #333;border-top:none;padding:4px 8px;width:28%;font-size:10px;"><b>Bill No:</b> ${invoice.billNo||''}</td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:4px 8px;width:22%;font-size:10px;"><b>HSN CODE:</b> ${CO.hsnCode}</td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:4px 8px;width:28%;font-size:10px;"><b>Date:</b> ${fmtDate(invoice.date)}</td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:4px 8px;width:22%;font-size:10px;"><b>State Code:</b> ${CO.stateCode}</td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:1px solid #333;border-top:none;padding:5px 8px;width:55%;vertical-align:top;font-size:10px;line-height:1.7;">
      <b>Customer/Receiver/Bill To Details</b><br/>
      <b>Name :</b> ${invoice.customer?.name||''}<br/>
      ${invoice.customer?.address?`<b>Address :</b> ${invoice.customer.address}<br/>`:''}
      ${invoice.customer?.gstin?`<b>GSTIN :</b> ${invoice.customer.gstin}`:''}
    </td>
    <td style="border:1px solid #333;border-top:none;border-left:none;padding:5px 8px;vertical-align:middle;font-size:10px;">
      ${invoice.customer?.gstin?`<b>GSTIN: ${invoice.customer.gstin}</b>`:'&nbsp;'}
    </td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-top:0;">
  <thead>${th}</thead>
  <tbody>${rows}</tbody>
</table>
${pgFooter}
</body></html>`
}

async function imgToBase64(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise(r => { const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(blob) })
  } catch { return null }
}

function openPrint(html) {
  const w = window.open('','_blank','width=960,height=750')
  if (!w) { alert('Allow popups to download PDF'); return }
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(()=>w.print(),700)
}

// ── Sub-components ─────────────────────────────────────────────────────────────
const iCls = `w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-white/[0.04]
  border border-gray-200 dark:border-white/[0.08] text-gray-800 dark:text-gray-200
  placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none
  focus:border-indigo-400 dark:focus:border-indigo-500/50
  focus:ring-2 focus:ring-indigo-500/10 transition-all`

function Field({ label, icon: Icon, required, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
        {Icon && <Icon size={11}/>}{label}{required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  )
}

function StatusBadge({ status }) {
  const m = {
    paid:'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    pending:'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    draft:'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-500',
  }
  return <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',m[status]||m.draft)}>{status}</span>
}

const TABS = ['Generate Invoice','All Invoices']

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function InvoicePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)

  // Invoice meta
  const [billNo,   setBillNo]   = useState('GCC/25-26/')
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0,10))
  const [customer, setCustomer] = useState({
  name: 'INDILOG MOVING PVT LTD',
  address: 'PLOT NO 47, KH NO 26/16, RAJU ENCLAVE, KAKROLA, NEW DELHI',
  gstin: '07AAFCI2288G1ZH'
})

  // Entries from DB
  const [allEntries,    setAllEntries]    = useState([])
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [loadingEntries,setLoadingEntries]= useState(true)
  const [entryError,    setEntryError]    = useState(null)

  // Filters
  const [search,    setSearch]    = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [fromCity,  setFromCity]  = useState('')
  const [toCity,    setToCity]    = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // PDF/generate state
  const [generating,  setGenerating]  = useState(false)
  const [genError,    setGenError]    = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHTML, setPreviewHTML] = useState('')

  // All Invoices tab
  const [invoices,   setInvoices]   = useState([])
  const [loadingInv, setLoadingInv] = useState(true)
  const [invError,   setInvError]   = useState(null)

  // ── Load entries ──────────────────────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    setLoadingEntries(true); setEntryError(null)
    try {
      const res = await entriesAPI.getAll()
      setAllEntries(res.data || [])
    } catch(e) { setEntryError(e.message) }
    finally    { setLoadingEntries(false) }
  }, [])

  const loadInvoices = useCallback(async () => {
    setLoadingInv(true); setInvError(null)
    try {
      const res = await invoicesAPI.getAll()
      setInvoices(res.data || [])
    } catch(e) { setInvError(e.message) }
    finally    { setLoadingInv(false) }
  }, [])

  useEffect(()=>{ loadEntries() },[loadEntries])
  useEffect(()=>{ if(tab===1) loadInvoices() },[tab,loadInvoices])

  // ── Filtered entries ──────────────────────────────────────────────────────
  const filtered = useMemo(() => allEntries.filter(e => {
    const s = search.toLowerCase()
    const matchSearch = !search ||
      e.vehicleNo?.toLowerCase().includes(s) ||
      e.model?.toLowerCase().includes(s) ||
      e.from?.toLowerCase().includes(s) ||
      e.to?.toLowerCase().includes(s)
    const matchDate =
      (!startDate || new Date(e.pickupDate) >= new Date(startDate)) &&
      (!endDate   || new Date(e.pickupDate) <= new Date(endDate))
    const matchRoute =
      (!fromCity || e.from?.toLowerCase().includes(fromCity.toLowerCase())) &&
      (!toCity   || e.to?.toLowerCase().includes(toCity.toLowerCase()))
    return matchSearch && matchDate && matchRoute
  }), [allEntries, search, startDate, endDate, fromCity, toCity])

  const activeFilters = [search, startDate, endDate, fromCity, toCity].filter(Boolean).length

  // ── Selection helpers ─────────────────────────────────────────────────────
  const selected   = allEntries.filter(e => selectedIds.has(e._id))
  const subtotal   = selected.reduce((s,e)=>s+Number(e.freight||0),0)
  const igst       = Math.round(subtotal*18/100*100)/100
  const grand      = subtotal+igst

  const toggleEntry = id => setSelectedIds(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  const toggleAll   = () => setSelectedIds(selectedIds.size===filtered.length && filtered.length>0 ? new Set() : new Set(filtered.map(e=>e._id)))

  const clearFilters = () => { setSearch(''); setStartDate(''); setEndDate(''); setFromCity(''); setToCity('') }

  // ── Validate + PDF ────────────────────────────────────────────────────────
  const validate = () => {
    if (!billNo.trim())        return 'Bill No. is required'
    if (!billDate)             return 'Date is required'
    if (!customer.name.trim()) return 'Customer name is required'
    if (!selected.length)      return 'Select at least one entry'
    return null
  }

  const getHTML = async () => {
    let logoB64 = null
    try { logoB64 = await imgToBase64('/public/logo.png') } catch {}
    return buildInvoiceHTML({ billNo:billNo.trim(), date:billDate, customer, entries:selected, gstRate:18 }, logoB64)
  }

  const handlePreview = async () => {
    const err = validate(); if(err){ alert(err); return }
    setGenerating(true)
    try { const html = await getHTML(); setPreviewHTML(html); setShowPreview(true) }
    finally { setGenerating(false) }
  }

  const handleDownload = async () => {
    const err = validate(); if(err){ alert(err); return }
    setGenerating(true); setGenError(null)
    try {
      await invoicesAPI.create({ billNo:billNo.trim(), date:billDate, customer, entryIds:selected.map(e=>e._id), gstRate:18 })
      loadInvoices()
      const html = await getHTML(); openPrint(html)
    } catch(e) {
      const html = await getHTML(); openPrint(html)
      setGenError('PDF opened. DB save failed: '+e.message)
    } finally { setGenerating(false) }
  }

  const deleteInvoice = async id => {
    if (!confirm('Delete this invoice?')) return
    try { await invoicesAPI.delete(id); setInvoices(p=>p.filter(i=>i._id!==id)) }
    catch(e) { alert(e.message) }
  }

  // ── Unique city lists for route filter dropdowns ───────────────────────────
  const fromCities = [...new Set(allEntries.map(e=>e.from).filter(Boolean))].sort()
  const toCities   = [...new Set(allEntries.map(e=>e.to).filter(Boolean))].sort()

  return (
    <div className="animate-fade-in space-y-4 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate('/')} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
            <ArrowLeft size={16}/>
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Generate GST invoices · Goyal Car Carrier format</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.04] rounded-xl p-1 w-fit">
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab===i?'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm':'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}>
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Generate ──────────────────────────────────────────────── */}
      {tab===0 && (
        <>
          {genError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              <AlertCircle size={14}/>{genError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left col */}
            <div className="space-y-4">
              {/* Invoice meta */}
              <div className="bg-white dark:bg-[#13131f] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] shadow-card dark:shadow-card-dark">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center"><FileText size={14} className="text-indigo-500"/></div>
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Invoice Details</h2>
                </div>
                <div className="space-y-3">
                  <Field label="Bill No." icon={Hash} required>
                    <input value={billNo} onChange={e=>setBillNo(e.target.value)} placeholder="GCC/25-26/006" className={iCls}/>
                  </Field>
                  <Field label="Invoice Date" icon={Calendar} required>
                    <input type="date" value={billDate} onChange={e=>setBillDate(e.target.value)} className={iCls}/>
                  </Field>
                </div>
              </div>

              {/* Customer */}
              <div className="bg-white dark:bg-[#13131f] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] shadow-card dark:shadow-card-dark">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Building2 size={14} className="text-emerald-500"/></div>
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Bill To</h2>
                </div>
                <div className="space-y-3">
                  <Field label="Company Name" required>
                    <input value={customer.name} onChange={e=>setCustomer(c=>({...c,name:e.target.value}))} placeholder="INDILOG MOVING PVT LTD" className={iCls}/>
                  </Field>
                  <Field label="Address" icon={MapPin}>
                    <textarea value={customer.address} rows={3} onChange={e=>setCustomer(c=>({...c,address:e.target.value}))} placeholder="Plot No 47, New Delhi" className={iCls+' resize-none'}/>
                  </Field>
                  <Field label="GSTIN" icon={CreditCard}>
                    <input value={customer.gstin} onChange={e=>setCustomer(c=>({...c,gstin:e.target.value.toUpperCase()}))} placeholder="07AAFCI2288G1ZH" className={iCls+' font-mono'}/>
                  </Field>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white dark:bg-[#13131f] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] shadow-card dark:shadow-card-dark">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Totals Preview</h2>
                <div className="space-y-2">
                  {[['Sub Total', fmt2(subtotal)],['IGST @18%', fmt2(igst)]].map(([l,v])=>(
                    <div key={l} className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{l}</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">₹{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Grand Total</span>
                    <span className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">₹{fmt2(grand)}</span>
                  </div>
                  {grand>0 && <p className="text-[10px] text-gray-400 dark:text-gray-600 italic pt-1 leading-relaxed">{numberToWords(grand)}</p>}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <button onClick={handlePreview} disabled={generating}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors disabled:opacity-50">
                    {generating?<Loader2 size={14} className="animate-spin"/>:<Eye size={14}/>} Preview
                  </button>
                  <button onClick={handleDownload} disabled={generating}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shadow-glow-sm">
                    {generating?<Loader2 size={14} className="animate-spin"/>:<Download size={14}/>}
                    {generating?'Generating…':'Save & Download PDF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right col: entry selector with filters */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#13131f] rounded-2xl border border-gray-100 dark:border-white/[0.06] shadow-card dark:shadow-card-dark overflow-hidden">

                {/* Table toolbar */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Select Entries</h2>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{selectedIds.size} selected · {filtered.length} shown</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={toggleAll} className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                        {selectedIds.size===filtered.length&&filtered.length>0?'Deselect All':'Select All'}
                      </button>
                    </div>
                  </div>

                  {/* Search + Filter toggle row */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vehicle, model, city…"
                        className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all"/>
                    </div>
                    <button onClick={()=>setShowFilters(f=>!f)}
                      className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                        showFilters
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                          : 'bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.08]')}>
                      <SlidersHorizontal size={13}/>
                      Filters
                      {activeFilters>0 && <span className="ml-1 bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{activeFilters}</span>}
                      {showFilters?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
                    </button>
                  </div>

                  {/* Expanded filter panel */}
                  {showFilters && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-fade-in">
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-1">Start Date</label>
                        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-400 transition-all"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-1">End Date</label>
                        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-400 transition-all"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-1">From City</label>
                        <select value={fromCity} onChange={e=>setFromCity(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-400 transition-all">
                          <option value="">All</option>
                          {fromCities.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-1">To City</label>
                        <select value={toCity} onChange={e=>setToCity(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-400 transition-all">
                          <option value="">All</option>
                          {toCities.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {activeFilters>0 && (
                        <div className="col-span-full">
                          <button onClick={clearFilters} className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors">
                            ✕ Clear all filters
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Entry table */}
                {entryError ? (
                  <div className="p-8 flex flex-col items-center gap-3">
                    <AlertCircle size={24} className="text-red-400"/>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{entryError}</p>
                    <button onClick={loadEntries} className="flex items-center gap-1 text-xs text-indigo-500 font-semibold"><RefreshCw size={12}/> Retry</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[480px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-xs min-w-[620px]">
                      <thead className="sticky top-0 bg-white dark:bg-[#13131f] z-10 border-b border-gray-100 dark:border-white/[0.06]">
                        <tr>
                          <th className="w-10 px-4 py-3">
                            <input type="checkbox" checked={selectedIds.size===filtered.length&&filtered.length>0} onChange={toggleAll} className="rounded accent-indigo-500"/>
                          </th>
                          {['#','Vehicle No','Model','Route','Pickup','Drop','Freight'].map(h=>(
                            <th key={h} className="text-left text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-600 px-3 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingEntries
                          ? [...Array(6)].map((_,i)=><tr key={i}>{[...Array(8)].map((_,j)=><td key={j} className="px-3 py-3"><div className="skeleton h-4 rounded w-full"/></td>)}</tr>)
                          : filtered.length===0
                          ? <tr><td colSpan={8} className="py-12 text-center text-xs text-gray-400 dark:text-gray-600">
                              {allEntries.length===0
                                ? <span>No entries found. <button className="text-indigo-500 font-semibold" onClick={()=>navigate('/add-entry')}>Add Entry</button></span>
                                : 'No entries match your filters'}
                            </td></tr>
                          : filtered.map((entry, idx)=>{
                              const checked = selectedIds.has(entry._id)
                              return (
                                <tr key={entry._id} onClick={()=>toggleEntry(entry._id)}
                                  className={clsx('cursor-pointer transition-colors border-b border-gray-50 dark:border-white/[0.03]',
                                    checked?'bg-indigo-50/70 dark:bg-indigo-500/[0.08]':idx%2===0?'hover:bg-gray-50 dark:hover:bg-white/[0.02]':'bg-gray-50/30 dark:bg-white/[0.01] hover:bg-gray-50 dark:hover:bg-white/[0.03]')}>
                                  <td className="px-4 py-2.5" onClick={e=>e.stopPropagation()}>
                                    <input type="checkbox" checked={checked} onChange={()=>toggleEntry(entry._id)} className="rounded accent-indigo-500"/>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">{String(entry.sNo||idx+1).padStart(2,'0')}</span>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className={clsx('font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md',checked?'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300':'bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300')}>
                                      {entry.vehicleNo}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{entry.model}</td>
                                  <td className="px-3 py-2.5 text-gray-500 dark:text-gray-500">{entry.from} → {entry.to}</td>
                                  <td className="px-3 py-2.5 font-mono text-gray-500 dark:text-gray-500">{fmtDate(entry.pickupDate)}</td>
                                  <td className="px-3 py-2.5 font-mono text-gray-500 dark:text-gray-500">{fmtDate(entry.dropDate)}</td>
                                  <td className="px-3 py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{Number(entry.freight).toLocaleString('en-IN')}</td>
                                </tr>
                              )
                            })
                        }
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedIds.size>0 && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.06] bg-indigo-50/50 dark:bg-indigo-500/[0.05] flex items-center justify-between">
                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400">{selectedIds.size} entries selected</p>
                    <p className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400">Subtotal: ₹{fmt2(subtotal)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 1: All Invoices ───────────────────────────────────────────── */}
      {tab===1 && (
        <div className="space-y-3">
          {invError ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <AlertCircle size={24} className="text-red-400"/>
              <p className="text-xs text-gray-400">{invError}</p>
              <button onClick={loadInvoices} className="flex items-center gap-1 text-xs text-indigo-500 font-semibold"><RefreshCw size={12}/> Retry</button>
            </div>
          ) : loadingInv
            ? [...Array(4)].map((_,i)=><div key={i} className="skeleton h-20 rounded-2xl"/>)
            : invoices.length===0
            ? <div className="flex flex-col items-center py-20 gap-3">
                <span className="text-5xl">🧾</span>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No invoices yet</p>
                <button onClick={()=>setTab(0)} className="text-xs text-indigo-500 font-semibold">Generate your first invoice →</button>
              </div>
            : invoices.map(inv=>(
                <div key={inv._id} className="bg-white dark:bg-[#13131f] rounded-2xl p-4 border border-gray-100 dark:border-white/[0.06] flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center"><FileText size={18} className="text-indigo-500"/></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{inv.invoiceNo||inv.billNo}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{inv.customer?.name} · {fmtDate(inv.date||inv.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">₹{fmt2(inv.grandTotal)}</p>
                      <StatusBadge status={inv.status}/>
                    </div>
                    <button onClick={()=>deleteInvoice(inv._id)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.08]">
              <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">Invoice Preview</h3>
              <div className="flex items-center gap-2">
                <button onClick={()=>{openPrint(previewHTML);setShowPreview(false)}}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition-opacity">
                  <Download size={14}/> Download PDF
                </button>
                <button onClick={()=>setShowPreview(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                  <X size={15}/>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe srcDoc={previewHTML} title="Invoice Preview" className="w-full" style={{height:'78vh',border:'none'}}/>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}