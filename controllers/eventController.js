const Event = require('../models/Event');
const Group = require('../models/Group');

// Créer un événement
exports.createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      location,
      coverPhoto,
      isPrivate,
      organizers,
      participants,
      groupId
    } = req.body;

    // S'assurer que le créateur est dans les organisateurs
    const eventOrganizers = organizers && organizers.length > 0 
      ? [...new Set([req.user._id.toString(), ...organizers])]
      : [req.user._id];

    const event = new Event({
      name,
      description,
      startDate,
      endDate,
      location,
      coverPhoto,
      isPrivate: isPrivate || false,
      organizers: eventOrganizers,
      participants: participants || [],
      groupId: groupId || null
    });

    await event.save();

    // Si l'événement est créé depuis un groupe, inviter automatiquement les membres
    if (groupId) {
      const group = await Group.findById(groupId);
      if (group && group.members.length > 0) {
        event.participants = [...new Set([...event.participants.map(p => p.toString()), ...group.members.map(m => m.toString())])];
        await event.save();
      }
    }

    res.status(201).json({ message: 'Événement créé avec succès', event });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'événement', error: error.message });
  }
};

// Obtenir tous les événements (publics ou ceux auxquels l'utilisateur participe)
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { isPrivate: false },
        { participants: req.user._id },
        { organizers: req.user._id }
      ]
    })
      .populate('organizers', 'firstName lastName email')
      .populate('participants', 'firstName lastName email')
      .sort({ startDate: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des événements', error: error.message });
  }
};

// Obtenir un événement par ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizers', 'firstName lastName email')
      .populate('participants', 'firstName lastName email')
      .populate('groupId', 'name type');

    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier l'accès si l'événement est privé
    if (event.isPrivate) {
      const isParticipant = event.participants.some(p => p._id.toString() === req.user._id.toString());
      const isOrganizer = event.organizers.some(o => o._id.toString() === req.user._id.toString());
      if (!isParticipant && !isOrganizer) {
        return res.status(403).json({ message: 'Accès refusé à cet événement privé' });
      }
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'événement', error: error.message });
  }
};

// Mettre à jour un événement
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'utilisateur est organisateur
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent modifier l\'événement' });
    }

    const updates = req.body;
    Object.assign(event, updates);
    await event.save();

    res.json({ message: 'Événement mis à jour avec succès', event });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'événement', error: error.message });
  }
};

// Supprimer un événement
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'utilisateur est organisateur
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent supprimer l\'événement' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement', error: error.message });
  }
};

// Rejoindre un événement
exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous participez déjà à cet événement' });
    }

    event.participants.push(req.user._id);
    await event.save();

    res.json({ message: 'Vous avez rejoint l\'événement avec succès', event });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la participation à l\'événement', error: error.message });
  }
};

// Quitter un événement
exports.leaveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Ne pas permettre aux organisateurs de quitter
    if (event.organizers.includes(req.user._id)) {
      return res.status(400).json({ message: 'Les organisateurs ne peuvent pas quitter l\'événement' });
    }

    event.participants = event.participants.filter(p => p.toString() !== req.user._id.toString());
    await event.save();

    res.json({ message: 'Vous avez quitté l\'événement avec succès', event });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la sortie de l\'événement', error: error.message });
  }
};

// Activer/désactiver la shopping list
exports.toggleShoppingList = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent modifier ce paramètre' });
    }

    event.shoppingListEnabled = !event.shoppingListEnabled;
    await event.save();

    res.json({ message: `Shopping list ${event.shoppingListEnabled ? 'activée' : 'désactivée'}`, event });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la modification du paramètre', error: error.message });
  }
};

// Activer/désactiver le covoiturage
exports.toggleCarpooling = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent modifier ce paramètre' });
    }

    event.carpoolingEnabled = !event.carpoolingEnabled;
    await event.save();

    res.json({ message: `Covoiturage ${event.carpoolingEnabled ? 'activé' : 'désactivé'}`, event });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la modification du paramètre', error: error.message });
  }
};
