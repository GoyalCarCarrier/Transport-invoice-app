const mongoose = require('mongoose')

const entrySchema = new mongoose.Schema({
  sNo: { type: Number },
  vehicleNo: { type: String, required: true, uppercase: true, trim: true },
  model: { type: String, required: true, trim: true },
  from: { type: String, required: true, trim: true },
  to: { type: String, required: true, trim: true },
  pickupDate: { type: Date, required: true },
   dropDate:   { type: Date, default: null },
   delivered: { type: Boolean, default: false },
  freight: { type: Number, required: true, min: 0 },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
}, { timestamps: true })

// Auto-increment sNo before saving
entrySchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Entry').countDocuments()
    this.sNo = count + 1
  }
  next()
})

module.exports = mongoose.model('Entry', entrySchema)
