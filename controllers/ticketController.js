const TicketType = require('../models/TicketType');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

// Créer un type de billet
exports.createTicketType = async (req, res) => {
  try {
    const { eventId, name, amount, quantityLimit } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'événement est public
    if (event.isPrivate) {
      return res.status(400).json({ message: 'La billetterie n\'est disponible que pour les événements publics' });
    }

    // Vérifier que l'utilisateur est organisateur
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent créer des types de billets' });
    }

    const ticketType = new TicketType({
      eventId,
      name,
      amount,
      quantityLimit
    });

    await ticketType.save();
    res.status(201).json({ message: 'Type de billet créé avec succès', ticketType });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du type de billet', error: error.message });
  }
};

// Obtenir tous les types de billets d'un événement
exports.getEventTicketTypes = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const ticketTypes = await TicketType.find({ eventId: req.params.eventId })
      .sort({ createdAt: -1 });

    res.json(ticketTypes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des types de billets', error: error.message });
  }
};

// Acheter un billet
exports.purchaseTicket = async (req, res) => {
  try {
    const { ticketTypeId, buyerFirstName, buyerLastName, buyerAddress } = req.body;

    const ticketType = await TicketType.findById(ticketTypeId);
    if (!ticketType) {
      return res.status(404).json({ message: 'Type de billet non trouvé' });
    }

    const event = await Event.findById(ticketType.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier qu'il reste des billets disponibles
    if (ticketType.soldQuantity >= ticketType.quantityLimit) {
      return res.status(400).json({ message: 'Plus de billets disponibles pour ce type' });
    }

    // Vérifier qu'une personne extérieure n'a pas déjà acheté un billet pour cet événement
    // (on vérifie par nom/prénom/adresse)
    const existingTicket = await Ticket.findOne({
      eventId: ticketType.eventId,
      buyerFirstName: buyerFirstName.trim(),
      buyerLastName: buyerLastName.trim(),
      buyerAddress: buyerAddress.trim()
    });

    if (existingTicket) {
      return res.status(400).json({ message: 'Vous avez déjà acheté un billet pour cet événement' });
    }

    const ticket = new Ticket({
      ticketTypeId,
      eventId: ticketType.eventId,
      buyerFirstName: buyerFirstName.trim(),
      buyerLastName: buyerLastName.trim(),
      buyerAddress: buyerAddress.trim()
    });

    await ticket.save();

    // Incrémenter le nombre de billets vendus
    ticketType.soldQuantity += 1;
    await ticketType.save();

    res.status(201).json({ message: 'Billet acheté avec succès', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'achat du billet', error: error.message });
  }
};

// Obtenir tous les billets d'un événement (pour les organisateurs)
exports.getEventTickets = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'utilisateur est organisateur
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent voir les billets vendus' });
    }

    const tickets = await Ticket.find({ eventId: req.params.eventId })
      .populate('ticketTypeId', 'name amount')
      .sort({ purchaseDate: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des billets', error: error.message });
  }
};

// Mettre à jour un type de billet
exports.updateTicketType = async (req, res) => {
  try {
    const ticketType = await TicketType.findById(req.params.id);
    if (!ticketType) {
      return res.status(404).json({ message: 'Type de billet non trouvé' });
    }

    const event = await Event.findById(ticketType.eventId);
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent modifier les types de billets' });
    }

    const { name, amount, quantityLimit } = req.body;
    if (name) ticketType.name = name;
    if (amount !== undefined) ticketType.amount = amount;
    if (quantityLimit !== undefined) {
      // Vérifier que la nouvelle limite n'est pas inférieure au nombre déjà vendu
      if (quantityLimit < ticketType.soldQuantity) {
        return res.status(400).json({ message: 'La quantité limitée ne peut pas être inférieure au nombre de billets déjà vendus' });
      }
      ticketType.quantityLimit = quantityLimit;
    }

    await ticketType.save();
    res.json({ message: 'Type de billet mis à jour avec succès', ticketType });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du type de billet', error: error.message });
  }
};

// Supprimer un type de billet
exports.deleteTicketType = async (req, res) => {
  try {
    const ticketType = await TicketType.findById(req.params.id);
    if (!ticketType) {
      return res.status(404).json({ message: 'Type de billet non trouvé' });
    }

    const event = await Event.findById(ticketType.eventId);
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent supprimer les types de billets' });
    }

    // Vérifier qu'aucun billet n'a été vendu
    if (ticketType.soldQuantity > 0) {
      return res.status(400).json({ message: 'Impossible de supprimer un type de billet pour lequel des billets ont déjà été vendus' });
    }

    await TicketType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Type de billet supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du type de billet', error: error.message });
  }
};
