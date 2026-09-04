const Enquiry = require('../models/Enquiry');

exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, phone, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ message: 'Please provide all enquiry fields' });
    }
    const enquiry = await Enquiry.create({ name, phone, message });
    res.status(201).json(enquiry);
  } catch (error) {
    next(error);
  }
};

exports.getEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (error) {
    next(error);
  }
};

exports.deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    await enquiry.deleteOne();
    res.json({ message: 'Enquiry deleted' });
  } catch (error) {
    next(error);
  }
};

exports.markResolved = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    enquiry.resolved = true;
    await enquiry.save();
    res.json(enquiry);
  } catch (error) {
    next(error);
  }
};
