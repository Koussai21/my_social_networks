const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketType',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  buyerFirstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  buyerLastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  buyerAddress: {
    type: String,
    required: [true, 'L\'adresse complète est requise'],
    trim: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
