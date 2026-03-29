const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  student: String,
  studentEmail: String,
  paid: Boolean,
  paidAt: Number,
  verified: Boolean
}, { _id: false });

const assignedCRSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String
}, { _id: false });

const pollSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  tokenId: String,
  assignedCR: assignedCRSchema,
  classroomId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  desc: String,
  price: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Number,
    required: true
  },
  expiresAt: {
    type: Number,
    required: true
  },
  document: String,
  qrCode: String,
  responses: [responseSchema],
  createdBy: {
    type: String,
    required: true
  },
  expired: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
