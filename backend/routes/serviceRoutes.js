const express = require('express');
const { getServices, createService } = require('../controllers/serviceController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getServices);
router.post('/', protect, admin, createService);

module.exports = router;
