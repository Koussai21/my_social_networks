const Poll = require('../models/Poll');
const Event = require('../models/Event');

// Créer un sondage
exports.createPoll = async (req, res) => {
  try {
    const { eventId, title, questions } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'utilisateur est organisateur
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent créer des sondages' });
    }

    const poll = new Poll({
      eventId,
      createdBy: req.user._id,
      title,
      questions: questions.map(q => ({
        question: q.question,
        options: q.options,
        responses: []
      }))
    });

    await poll.save();
    res.status(201).json({ message: 'Sondage créé avec succès', poll });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du sondage', error: error.message });
  }
};

// Obtenir tous les sondages d'un événement
exports.getEventPolls = async (req, res) => {
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

    const polls = await Poll.find({ eventId: req.params.eventId })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des sondages', error: error.message });
  }
};

// Obtenir un sondage par ID
exports.getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('questions.responses.participant', 'firstName lastName email');

    if (!poll) {
      return res.status(404).json({ message: 'Sondage non trouvé' });
    }

    const event = await Event.findById(poll.eventId);
    if (event.isPrivate) {
      const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                           event.organizers.some(o => o.toString() === req.user._id.toString());
      if (!isParticipant) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du sondage', error: error.message });
  }
};

// Répondre à un sondage
exports.answerPoll = async (req, res) => {
  try {
    const { answers } = req.body; // Array of { questionIndex, selectedOption }
    const pollId = req.params.id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Sondage non trouvé' });
    }

    const event = await Event.findById(poll.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                         event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'Seuls les participants peuvent répondre aux sondages' });
    }

    // Vérifier que toutes les questions ont une réponse
    if (answers.length !== poll.questions.length) {
      return res.status(400).json({ message: 'Vous devez répondre à toutes les questions' });
    }

    // Vérifier que l'utilisateur n'a pas déjà répondu
    const hasAlreadyAnswered = poll.questions.some(q => 
      q.responses.some(r => r.participant.toString() === req.user._id.toString())
    );
    if (hasAlreadyAnswered) {
      return res.status(400).json({ message: 'Vous avez déjà répondu à ce sondage' });
    }

    // Ajouter les réponses
    answers.forEach((answer, index) => {
      const question = poll.questions[index];
      if (!question.options.includes(answer.selectedOption)) {
        throw new Error(`L'option "${answer.selectedOption}" n'existe pas pour la question ${index + 1}`);
      }
      question.responses.push({
        participant: req.user._id,
        selectedOption: answer.selectedOption
      });
    });

    await poll.save();

    const updatedPoll = await Poll.findById(pollId)
      .populate('createdBy', 'firstName lastName email')
      .populate('questions.responses.participant', 'firstName lastName email');

    res.json({ message: 'Réponses enregistrées avec succès', poll: updatedPoll });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement des réponses', error: error.message });
  }
};

// Supprimer un sondage
exports.deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Sondage non trouvé' });
    }

    const event = await Event.findById(poll.eventId);
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isOrganizer) {
      return res.status(403).json({ message: 'Seuls les organisateurs peuvent supprimer les sondages' });
    }

    await Poll.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sondage supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du sondage', error: error.message });
  }
};
