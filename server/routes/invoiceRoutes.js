const express = require('express')
const router  = express.Router()
const {
  getInvoices, getInvoice, createInvoice, updateInvoiceStatus, deleteInvoice,
} = require('../controllers/invoiceController')

router.get('/',           getInvoices)
router.get('/:id',        getInvoice)
router.post('/',          createInvoice)
router.patch('/:id/status', updateInvoiceStatus)
router.delete('/:id',     deleteInvoice)

module.exports = router
