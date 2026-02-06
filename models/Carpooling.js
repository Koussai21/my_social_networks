const mongoose = require('mongoose');

const carpoolingSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  departureLocation: {
    type: String,
    required: [true, 'Le lieu de départ est requis'],
    trim: true
  },
  departureTime: {
    type: Date,
    required: [true, 'L\'heure de départ est requise']
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  availableSeats: {
    type: Number,
    required: [true, 'Le nombre de places disponibles est requis'],
    min: [1, 'Il doit y avoir au moins 1 place disponible']
  },
  maxTimeDeviation: {
    type: Number,
    required: [true, 'Le temps maximum d\'écart est requis'],
    min: [0, 'Le temps d\'écart ne peut pas être négatif']
  },
  passengers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Carpooling', carpoolingSchema);
