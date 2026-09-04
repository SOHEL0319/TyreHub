const Product = require('../models/Product');
const uploadDir = 'uploads';

exports.getProducts = async (req, res, next) => {
  try {
    const filters = {};
    const { vehicleType, brand, size, minPrice, maxPrice, search } = req.query;
    if (vehicleType) filters.vehicleType = vehicleType;
    if (brand) filters.brand = brand;
    if (size) filters.size = size;
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filters).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, brand, category, vehicleType, size, price, stock, description } = req.body;
    let image = req.body.image || '';
    if (req.file) {
      image = `/${uploadDir}/${req.file.filename}`;
    }
    const product = await Product.create({ name, brand, category, vehicleType, size, price, stock, description, image });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updates = req.body;
    if (req.file) {
      updates.image = `/${uploadDir}/${req.file.filename}`;
    } else if (req.body.image) {
      updates.image = req.body.image;
    }

    Object.assign(product, updates);
    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { adjustment } = req.body;
    if (typeof adjustment !== 'number') {
      return res.status(400).json({ message: 'Stock adjustment must be a number' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.stock = Math.max(0, product.stock + adjustment);
    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};
