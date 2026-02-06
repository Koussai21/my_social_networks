const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  broughtBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Le nom de l\'article est requis'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité est requise'],
    min: [1, 'La quantité doit être au moins de 1']
  },
  arrivalTime: {
    type: Date,
    required: [true, 'L\'heure d\'arrivée est requise']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour garantir l'unicité du nom par événement
shoppingListItemSchema.index({ eventId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ShoppingListItem', shoppingListItemSchema);
