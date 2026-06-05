const Invoice = require('../models/Invoice')
const Entry   = require('../models/Entry')

// numberToWords (server-side)
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
function ch(n){if(n===0)return '';if(n<20)return ones[n]+' ';if(n<100)return tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'')+' ';return ones[Math.floor(n/100)]+' Hundred '+ch(n%100)}
function toWords(n){if(n===0)return 'Zero';let r='';if(n>=10000000){r+=ch(Math.floor(n/10000000))+'Crore ';n%=10000000}if(n>=100000){r+=ch(Math.floor(n/100000))+'Lakh ';n%=100000}if(n>=1000){r+=ch(Math.floor(n/1000))+'Thousand ';n%=1000}r+=ch(n);return r.trim()}
function numberToWords(amount){const n=Math.floor(amount||0);const p=Math.round((amount-n)*100);let r='Rupees '+toWords(n);if(p>0)r+=' and '+toWords(p)+' Paise';return r+' Only'}

exports.getInvoices = async (req, res) => {
  try {
    const data = await Invoice.find().sort({ createdAt: -1 })
    res.json({ success: true, data })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('entries')
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' })
    res.json({ success: true, data: invoice })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.createInvoice = async (req, res) => {
  try {
    const { billNo, date, customer, entryIds, gstRate = 18 } = req.body
    if (!billNo)          return res.status(400).json({ success: false, message: 'billNo is required' })
    if (!customer?.name)  return res.status(400).json({ success: false, message: 'customer.name is required' })
    if (!entryIds?.length) return res.status(400).json({ success: false, message: 'Select at least one entry' })

    const entries  = await Entry.find({ _id: { $in: entryIds } })
    const subtotal = entries.reduce((s, e) => s + e.freight, 0)
    const gstAmount  = Math.round(subtotal * gstRate / 100 * 100) / 100
    const grandTotal = subtotal + gstAmount

    const invoice = await Invoice.create({
      billNo,
      date:    date || new Date(),
      customer,
      entries: entryIds,
      gstRate,
      subtotal,
      gstAmount,
      grandTotal,
      amountInWords: numberToWords(grandTotal),
    })

    res.status(201).json({ success: true, data: invoice })
  } catch(err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' })
    res.json({ success: true, data: invoice })
  } catch(err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id)
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' })
    res.json({ success: true, message: 'Invoice deleted' })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
