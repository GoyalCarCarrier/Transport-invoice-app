const express = require('express')
const router  = express.Router()
const {
  getEntries, getEntry, createEntry, updateEntry, deleteEntry, getStats,
} = require('../controllers/entryController')

router.get('/stats', getStats)   // must be before /:id
router.get('/',      getEntries)
router.get('/:id',   getEntry)
router.post('/',     createEntry)
router.put('/:id',   updateEntry)
router.delete('/:id', deleteEntry)

module.exports = router
