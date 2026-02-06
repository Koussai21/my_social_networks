const Carpooling = require('../models/Carpooling');
const Event = require('../models/Event');

// Créer une offre de covoiturage
exports.createCarpooling = async (req, res) => {
  try {
    const { eventId, departureLocation, departureTime, price, availableSeats, maxTimeDeviation } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que le covoiturage est activé
    if (!event.carpoolingEnabled) {
      return res.status(400).json({ message: 'Le covoiturage n\'est pas activé pour cet événement' });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                         event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'Seuls les participants peuvent créer des offres de covoiturage' });
    }

    const carpooling = new Carpooling({
      eventId,
      driver: req.user._id,
      departureLocation,
      departureTime,
      price,
      availableSeats,
      maxTimeDeviation
    });

    await carpooling.save();

    const populatedCarpooling = await Carpooling.findById(carpooling._id)
      .populate('driver', 'firstName lastName email')
      .populate('passengers', 'firstName lastName email');

    res.status(201).json({ message: 'Offre de covoiturage créée avec succès', carpooling: populatedCarpooling });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'offre de covoiturage', error: error.message });
  }
};

// Obtenir toutes les offres de covoiturage d'un événement
exports.getEventCarpoolings = async (req, res) => {
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

    const carpoolings = await Carpooling.find({ eventId: req.params.eventId })
      .populate('driver', 'firstName lastName email')
      .populate('passengers', 'firstName lastName email')
      .sort({ departureTime: 1 });

    res.json(carpoolings);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des offres de covoiturage', error: error.message });
  }
};

// Rejoindre un covoiturage
exports.joinCarpooling = async (req, res) => {
  try {
    const carpooling = await Carpooling.findById(req.params.id);
    if (!carpooling) {
      return res.status(404).json({ message: 'Offre de covoiturage non trouvée' });
    }

    // Vérifier que l'utilisateur n'est pas le conducteur
    if (carpooling.driver.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas rejoindre votre propre covoiturage' });
    }

    // Vérifier qu'il reste des places
    if (carpooling.passengers.length >= carpooling.availableSeats) {
      return res.status(400).json({ message: 'Plus de places disponibles' });
    }

    // Vérifier que l'utilisateur n'est pas déjà passager
    if (carpooling.passengers.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous êtes déjà passager de ce covoiturage' });
    }

    carpooling.passengers.push(req.user._id);
    await carpooling.save();

    const populatedCarpooling = await Carpooling.findById(carpooling._id)
      .populate('driver', 'firstName lastName email')
      .populate('passengers', 'firstName lastName email');

    res.json({ message: 'Vous avez rejoint le covoiturage avec succès', carpooling: populatedCarpooling });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la participation au covoiturage', error: error.message });
  }
};

// Quitter un covoiturage
exports.leaveCarpooling = async (req, res) => {
  try {
    const carpooling = await Carpooling.findById(req.params.id);
    if (!carpooling) {
      return res.status(404).json({ message: 'Offre de covoiturage non trouvée' });
    }

    // Vérifier que l'utilisateur est passager
    if (!carpooling.passengers.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous n\'êtes pas passager de ce covoiturage' });
    }

    carpooling.passengers = carpooling.passengers.filter(p => p.toString() !== req.user._id.toString());
    await carpooling.save();

    const populatedCarpooling = await Carpooling.findById(carpooling._id)
      .populate('driver', 'firstName lastName email')
      .populate('passengers', 'firstName lastName email');

    res.json({ message: 'Vous avez quitté le covoiturage avec succès', carpooling: populatedCarpooling });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la sortie du covoiturage', error: error.message });
  }
};

// Mettre à jour une offre de covoiturage
exports.updateCarpooling = async (req, res) => {
  try {
    const carpooling = await Carpooling.findById(req.params.id);
    if (!carpooling) {
      return res.status(404).json({ message: 'Offre de covoiturage non trouvée' });
    }

    // Vérifier que l'utilisateur est le conducteur
    if (carpooling.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le conducteur peut modifier l\'offre' });
    }

    const { departureLocation, departureTime, price, availableSeats, maxTimeDeviation } = req.body;
    if (departureLocation) carpooling.departureLocation = departureLocation;
    if (departureTime) carpooling.departureTime = departureTime;
    if (price !== undefined) carpooling.price = price;
    if (availableSeats !== undefined) {
      // Vérifier que le nouveau nombre de places n'est pas inférieur au nombre de passagers actuels
      if (availableSeats < carpooling.passengers.length) {
        return res.status(400).json({ message: 'Le nombre de places ne peut pas être inférieur au nombre de passagers actuels' });
      }
      carpooling.availableSeats = availableSeats;
    }
    if (maxTimeDeviation !== undefined) carpooling.maxTimeDeviation = maxTimeDeviation;

    await carpooling.save();

    const populatedCarpooling = await Carpooling.findById(carpooling._id)
      .populate('driver', 'firstName lastName email')
      .populate('passengers', 'firstName lastName email');

    res.json({ message: 'Offre de covoiturage mise à jour avec succès', carpooling: populatedCarpooling });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'offre', error: error.message });
  }
};

// Supprimer une offre de covoiturage
exports.deleteCarpooling = async (req, res) => {
  try {
    const carpooling = await Carpooling.findById(req.params.id);
    if (!carpooling) {
      return res.status(404).json({ message: 'Offre de covoiturage non trouvée' });
    }

    // Vérifier que l'utilisateur est le conducteur
    if (carpooling.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le conducteur peut supprimer l\'offre' });
    }

    await Carpooling.findByIdAndDelete(req.params.id);
    res.json({ message: 'Offre de covoiturage supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'offre', error: error.message });
  }
};
