const Service = require('../models/Service');

exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json(services);
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const service = await Service.create({ name, description, image });
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};
