const express = require('express');
const { getDashboardStats, getAdminUsers } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/users', protect, admin, getAdminUsers);

module.exports = router;
