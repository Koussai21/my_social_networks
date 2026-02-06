const ShoppingListItem = require('../models/ShoppingListItem');
const Event = require('../models/Event');

// Ajouter un article à la shopping list
exports.addItem = async (req, res) => {
  try {
    const { eventId, name, quantity, arrivalTime } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que la shopping list est activée
    if (!event.shoppingListEnabled) {
      return res.status(400).json({ message: 'La shopping list n\'est pas activée pour cet événement' });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                         event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'Seuls les participants peuvent ajouter des articles' });
    }

    const item = new ShoppingListItem({
      eventId,
      broughtBy: req.user._id,
      name,
      quantity,
      arrivalTime
    });

    await item.save();

    const populatedItem = await ShoppingListItem.findById(item._id)
      .populate('broughtBy', 'firstName lastName email');

    res.status(201).json({ message: 'Article ajouté avec succès', item: populatedItem });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet article existe déjà pour cet événement' });
    }
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'article', error: error.message });
  }
};

// Obtenir tous les articles de la shopping list d'un événement
exports.getEventItems = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier l'accès
    if (event.isPrivate) {
      const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                           event.organizers.some(o => o.toString() === req.user._id.toString());
      if (!isParticipant) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    const items = await ShoppingListItem.find({ eventId: req.params.eventId })
      .populate('broughtBy', 'firstName lastName email')
      .sort({ arrivalTime: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des articles', error: error.message });
  }
};

// Mettre à jour un article
exports.updateItem = async (req, res) => {
  try {
    const item = await ShoppingListItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (item.broughtBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres articles' });
    }

    const { quantity, arrivalTime } = req.body;
    if (quantity !== undefined) item.quantity = quantity;
    if (arrivalTime) item.arrivalTime = arrivalTime;

    await item.save();

    const populatedItem = await ShoppingListItem.findById(item._id)
      .populate('broughtBy', 'firstName lastName email');

    res.json({ message: 'Article mis à jour avec succès', item: populatedItem });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'article', error: error.message });
  }
};

// Supprimer un article
exports.deleteItem = async (req, res) => {
  try {
    const item = await ShoppingListItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur ou un organisateur
    const event = await Event.findById(item.eventId);
    const isAuthor = item.broughtBy.toString() === req.user._id.toString();
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());

    if (!isAuthor && !isOrganizer) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres articles' });
    }

    await ShoppingListItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'article', error: error.message });
  }
};
