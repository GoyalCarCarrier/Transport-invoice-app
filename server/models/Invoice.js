const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String },               // auto-generated
  billNo:    { type: String, required: true }, // client-entered e.g. GCC/25-26/006
  date:      { type: Date,   default: Date.now },
  customer: {
    name:    { type: String, required: true },
    address: { type: String, default: '' },
    gstin:   { type: String, default: '' },
  },
  entries:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Entry' }],
  gstRate:      { type: Number, default: 18 },
  subtotal:     { type: Number, required: true },
  gstAmount:    { type: Number, required: true },
  grandTotal:   { type: Number, required: true },
  amountInWords: String,
  status: {
    type: String,
    enum: ['draft','pending','paid'],
    default: 'draft',
  },
  notes: String,
}, { timestamps: true })

// Auto invoice number
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNo) {
    const year  = new Date().getFullYear()
    const count = await mongoose.model('Invoice').countDocuments()
    this.invoiceNo = `INV-${year}-${String(count + 1).padStart(3, '0')}`
  }
  next()
})

module.exports = mongoose.model('Invoice', invoiceSchema)
