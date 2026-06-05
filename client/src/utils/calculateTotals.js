export function calculateTotals(subtotal, gstRate = 18) {
  const sub = parseFloat(subtotal) || 0
  const gstAmount  = Math.round(sub * gstRate / 100 * 100) / 100
  const grandTotal = Math.round((sub + gstAmount) * 100) / 100
  return { subtotal: sub, gstAmount, grandTotal, gstRate }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyCompact(amount) {
  if (amount >= 10000000) return `₹${(amount/10000000).toFixed(1)}Cr`
  if (amount >= 100000)   return `₹${(amount/100000).toFixed(1)}L`
  if (amount >= 1000)     return `₹${(amount/1000).toFixed(1)}K`
  return `₹${amount}`
}

export function sumFreight(entries) {
  return entries.reduce((a, e) => a + (parseFloat(e.freight) || 0), 0)
}
