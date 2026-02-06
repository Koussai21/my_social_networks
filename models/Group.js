const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du groupe est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },
  icon: {
    type: String
  },
  coverPhoto: {
    type: String
  },
  type: {
    type: String,
    enum: ['public', 'private', 'secret'],
    required: [true, 'Le type de groupe est requis'],
    default: 'public'
  },
  allowMemberPosts: {
    type: Boolean,
    default: true
  },
  allowMemberEvents: {
    type: Boolean,
    default: true
  },
  administrators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Group', groupSchema);
