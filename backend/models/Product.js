const mongoose = require('mongoose');

const BRAND_OPTIONS = ['MRF', 'CEAT', 'Apollo Tyres', 'JK Tyre', 'Bridgestone'];
const CATEGORY_OPTIONS = ['Bike Tyres', 'Car Tyres', 'Auto Tyres', 'Lorry Tyres'];
const VEHICLE_TYPES = ['Bike', 'Car', 'Auto', 'Lorry'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true, enum: BRAND_OPTIONS },
    category: { type: String, required: true, trim: true, enum: CATEGORY_OPTIONS },
    vehicleType: { type: String, required: true, trim: true, enum: VEHICLE_TYPES },
    size: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    image: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
