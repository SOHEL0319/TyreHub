const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Service = require('./models/Service');
const Enquiry = require('./models/Enquiry');

dotenv.config();

const seedData = async () => {
  await connectDB();

  await User.deleteMany();
  await Product.deleteMany();
  await Service.deleteMany();
  await Enquiry.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 12);
  await User.create({
    name: 'TyreHub Admin',
    email: 'admin@tyrehub.com',
    password: adminPassword,
    role: 'admin',
  });
  // Additional admin accounts requested
  await User.create({
    name: 'Rasheed Tyres Admin',
    email: 'rasheedtyresplanet@gmail.com',
    password: adminPassword,
    role: 'admin',
  });
  await User.create({
    name: 'Sohel NS Admin',
    email: 'sohelns1786@gmail.com',
    password: adminPassword,
    role: 'admin',
  });

  const products = [
    {
      name: 'MRF Rider Pro',
      brand: 'MRF',
      category: 'Bike Tyres',
      vehicleType: 'Bike',
      size: '2.75-18',
      price: 2499,
      stock: 18,
      description: 'High-performance bike tyre built for grip and control.',
      image: 'https://via.placeholder.com/500x500?text=MRF+Bike+Tyre',
    },
    {
      name: 'CEAT Milaze Touring',
      brand: 'CEAT',
      category: 'Car Tyres',
      vehicleType: 'Car',
      size: '185/65R15',
      price: 6799,
      stock: 7,
      description: 'Comfort-oriented car tyre with strong wet traction.',
      image: 'https://via.placeholder.com/500x500?text=CEAT+Car+Tyre',
    },
    {
      name: 'Apollo Alnac 4G',
      brand: 'Apollo Tyres',
      category: 'Car Tyres',
      vehicleType: 'Car',
      size: '195/55R16',
      price: 7599,
      stock: 4,
      description: 'Balanced car tyre for smooth handling and efficiency.',
      image: 'https://via.placeholder.com/500x500?text=Apollo+Car+Tyre',
    },
    {
      name: 'JK Tyre ECOWING',
      brand: 'JK Tyre',
      category: 'Bike Tyres',
      vehicleType: 'Bike',
      size: '100/90-18',
      price: 2299,
      stock: 5,
      description: 'Premium bike tyre engineered for long life and stability.',
      image: 'https://via.placeholder.com/500x500?text=JK+Bike+Tyre',
    },
    {
      name: 'Bridgestone Turanza',
      brand: 'Bridgestone',
      category: 'Car Tyres',
      vehicleType: 'Car',
      size: '205/55R16',
      price: 8399,
      stock: 3,
      description: 'Premium car tyre with excellent comfort and grip.',
      image: 'https://via.placeholder.com/500x500?text=Bridgestone+Car+Tyre',
    },
    {
      name: 'MRF Auto Grip',
      brand: 'MRF',
      category: 'Auto Tyres',
      vehicleType: 'Auto',
      size: '4.00-10',
      price: 1999,
      stock: 9,
      description: 'Robust auto tyre ideal for city use and high durability.',
      image: 'https://via.placeholder.com/500x500?text=MRF+Auto+Tyre',
    },
    {
      name: 'CEAT Comfort 4F',
      brand: 'CEAT',
      category: 'Lorry Tyres',
      vehicleType: 'Lorry',
      size: '11R22.5',
      price: 14999,
      stock: 2,
      description: 'Heavy-duty lorry tyre made for long haul stability.',
      image: 'https://via.placeholder.com/500x500?text=CEAT+Lorry+Tyre',
    },
    {
      name: 'Bridgestone Battlax Auto',
      brand: 'Bridgestone',
      category: 'Auto Tyres',
      vehicleType: 'Auto',
      size: '4.00-10',
      price: 2199,
      stock: 10,
      description: 'Premium auto tyre giving smooth city ride performance.',
      image: 'https://via.placeholder.com/500x500?text=Bridgestone+Auto+Tyre',
    },
  ];

  const services = [
    {
      name: 'Wheel Alignment',
      description: 'Precision wheel alignment for balanced steering and longer tyre life.',
      image: 'https://via.placeholder.com/500x300?text=Wheel+Alignment',
    },
    {
      name: 'Wheel Balancing',
      description: 'Professional balancing for smoother ride quality and tyre safety.',
      image: 'https://via.placeholder.com/500x300?text=Wheel+Balancing',
    },
    {
      name: 'Nitrogen Filling',
      description: 'Nitrogen inflation for stable pressure and cooler running temperatures.',
      image: 'https://via.placeholder.com/500x300?text=Nitrogen+Filling',
    },
    {
      name: 'Puncture Repair',
      description: 'Fast puncture repair using trusted materials to get you back on road.',
      image: 'https://via.placeholder.com/500x300?text=Puncture+Repair',
    },
    {
      name: 'Tyre Replacement',
      description: 'Full tyre replacement service with the right fit and expert fitting.',
      image: 'https://via.placeholder.com/500x300?text=Tyre+Replacement',
    },
  ];

  const enquiries = [
    {
      name: 'Suresh Kumar',
      phone: '9876543210',
      message: 'Can you suggest the best car tyre under 5000?',
    },
    {
      name: 'Anita Reddy',
      phone: '9123456780',
      message: 'Do you provide same-day tyre replacement for trucks?',
    },
  ];

  await Product.insertMany(products);
  await Service.insertMany(services);
  await Enquiry.insertMany(enquiries);

  console.log('Database seeded successfully');
  process.exit();
};

seedData().catch((error) => {
  console.error(error);
  process.exit(1);
});
