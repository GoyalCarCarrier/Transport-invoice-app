const Entry = require('../models/Entry')

exports.getEntries = async (req, res) => {
  try {
    const { search, page = 1, limit = 100, sort = 'sNo' } = req.query
    const filter = {}
    if (search) {
      filter.$or = [
        { vehicleNo: { $regex: search, $options: 'i' } },
        { model:     { $regex: search, $options: 'i' } },
        { from:      { $regex: search, $options: 'i' } },
        { to:        { $regex: search, $options: 'i' } },
      ]
    }
    const skip  = (parseInt(page) - 1) * parseInt(limit)
    const data  = await Entry.find(filter).sort(sort).skip(skip).limit(parseInt(limit))
    const total = await Entry.countDocuments(filter)
    res.json({ success: true, data, total, page: parseInt(page) })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getEntry = async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id)
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' })
    res.json({ success: true, data: entry })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.createEntry = async (req, res) => {
  try {
    const entry = await Entry.create(req.body)
    res.status(201).json({ success: true, data: entry })
  } catch(err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

exports.updateEntry = async (req, res) => {
  try {
    const entry = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' })
    res.json({ success: true, data: entry })
  } catch(err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await Entry.findByIdAndDelete(req.params.id)
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' })
    res.json({ success: true, message: 'Entry deleted' })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Dashboard stats
exports.getStats = async (req, res) => {
  try {
    const now      = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1)
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0)

    const [totalVehicles, freightAgg, thisMonthFreight, lastMonthFreight] = await Promise.all([
      Entry.countDocuments(),
      Entry.aggregate([{ $group: { _id: null, total: { $sum: '$freight' } } }]),
      Entry.aggregate([
        { $match: { createdAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: '$freight' } } },
      ]),
      Entry.aggregate([
        { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$freight' } } },
      ]),
    ])

    const totalFreight    = freightAgg[0]?.total    || 0
    const monthlyRevenue  = thisMonthFreight[0]?.total || 0
    const prevRevenue     = lastMonthFreight[0]?.total || 0
    const revenueGrowth   = prevRevenue > 0
      ? parseFloat(((monthlyRevenue - prevRevenue) / prevRevenue * 100).toFixed(1))
      : 0

    // Monthly chart: last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth()-i, 1)
      const mEnd   = new Date(now.getFullYear(), now.getMonth()-i+1, 0)
      const [agg]  = await Entry.aggregate([
        { $match: { createdAt: { $gte: mStart, $lte: mEnd } } },
        { $group: { _id: null, revenue: { $sum: '$freight' }, vehicles: { $sum: 1 } } },
      ])
      months.push({
        month:    mStart.toLocaleString('en-IN',{ month:'short' }),
        revenue:  agg?.revenue  || 0,
        vehicles: agg?.vehicles || 0,
      })
    }

    const Invoice = require('../models/Invoice')
    const [totalInvoices] = await Promise.all([Invoice.countDocuments()])

    res.json({
      success: true,
      data: {
        totalVehicles,
        totalFreight,
        totalInvoices,
        monthlyRevenue,
        revenueGrowth,
        monthlyChart: months,
      },
    })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
