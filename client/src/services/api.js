// ─────────────────────────────────────────────────────────────────────────────
// API SERVICE — connects to Node/Express backend → MongoDB Atlas
// Base URL from .env: VITE_API_URL=http://localhost:5000/api
// ─────────────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`)
  return data
}

// ── Entries CRUD ──────────────────────────────────────────────────────────────
export const entriesAPI = {
  getAll:  (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return req(`/entries${qs ? '?' + qs : ''}`)
  },
  getOne:  (id)       => req(`/entries/${id}`),
  create:  (body)     => req('/entries',     { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, body) => req(`/entries/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  delete:  (id)       => req(`/entries/${id}`, { method: 'DELETE' }),
  stats:   ()         => req('/entries/stats'),
}

// ── Invoices CRUD ─────────────────────────────────────────────────────────────
export const invoicesAPI = {
  getAll:       ()           => req('/invoices'),
  getOne:       (id)         => req(`/invoices/${id}`),
  create:       (body)       => req('/invoices',            { method: 'POST',  body: JSON.stringify(body) }),
  updateStatus: (id, status) => req(`/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete:       (id)         => req(`/invoices/${id}`,       { method: 'DELETE' }),
  pdfURL:       (id)         => `${BASE}/invoices/${id}/pdf`,
}
