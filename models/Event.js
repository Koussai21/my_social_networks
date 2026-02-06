const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'événement est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'La date de début est requise']
  },
  endDate: {
    type: Date,
    required: [true, 'La date de fin est requise'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'La date de fin doit être postérieure à la date de début'
    }
  },
  location: {
    type: String,
    required: [true, 'Le lieu est requis'],
    trim: true
  },
  coverPhoto: {
    type: String
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  organizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  shoppingListEnabled: {
    type: Boolean,
    default: false
  },
  carpoolingEnabled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);
