const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Le nom du type de billet est requis'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant ne peut pas être négatif']
  },
  quantityLimit: {
    type: Number,
    required: [true, 'La quantité limitée est requise'],
    min: [1, 'La quantité doit être au moins de 1']
  },
  soldQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TicketType', ticketTypeSchema);
