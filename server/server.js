require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const connectDB  = require('./config/db')

const entryRoutes   = require('./routes/entryRoutes')
const invoiceRoutes = require('./routes/invoiceRoutes')

const app = express()

connectDB()

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://transport-invoice-pbkp8748f-rahul-goyal-s-projects.vercel.app',  // vite preview
  ],
  methods: ['GET','POST','PUT','PATCH','DELETE'],
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
