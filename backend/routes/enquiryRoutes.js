const express = require('express');
const { createEnquiry, getEnquiries, deleteEnquiry, markResolved } = require('../controllers/enquiryController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', createEnquiry);
router.get('/', protect, admin, getEnquiries);
router.delete('/:id', protect, admin, deleteEnquiry);
router.put('/:id/resolve', protect, admin, markResolved);

module.exports = router;
