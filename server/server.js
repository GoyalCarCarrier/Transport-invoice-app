require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const connectDB  = require('./config/db')

const entryRoutes   = require('./routes/entryRoutes')
const invoiceRoutes = require('./routes/invoiceRoutes')

const app = express()

connectDB()

app.use(cors({
  origin: function(origin, callback) {
    if (
      !origin ||
      origin.includes('localhost') ||
      origin.includes('vercel.app')
    ) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

app.use('/api/entries',  entryRoutes)
app.use('/api/invoices', invoiceRoutes)

app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', message: 'Transport Invoice API running', db: 'MongoDB Atlas' }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`))
