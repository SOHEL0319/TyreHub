const Product = require('../models/Product');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Product.distinct('category').then((categories) => categories.length);
    const totalEnquiries = await Enquiry.countDocuments();
    const lowStockProducts = await Product.find({ stock: { $lte: 5, $gt: 0 } }).sort({ stock: 1 });
    const outOfStockProducts = await Product.find({ stock: 0 });
    const recentEnquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      totalProducts,
      totalCategories,
      totalEnquiries,
      lowStockProducts,
      outOfStockProducts,
      recentEnquiries,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};
