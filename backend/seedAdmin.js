const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/tyrehub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding admin...');

    const adminEmail = 'rasheedtyresplanet@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists. Updating role to admin...');
      existingAdmin.role = 'admin';
      await existingAdmin.save();
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Admin created successfully with password: admin123');
    }

    mongoose.disconnect();
    console.log('Done.');
  } catch (error) {
    console.error('Error seeding admin:', error);
    mongoose.disconnect();
  }
};

seedAdmin();
