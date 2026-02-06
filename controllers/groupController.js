const Group = require('../models/Group');
const Event = require('../models/Event');

// Créer un groupe
exports.createGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      coverPhoto,
      type,
      allowMemberPosts,
      allowMemberEvents,
      administrators,
      members
    } = req.body;

    // S'assurer que le créateur est dans les administrateurs
    const groupAdministrators = administrators && administrators.length > 0
      ? [...new Set([req.user._id.toString(), ...administrators])]
      : [req.user._id];

    const group = new Group({
      name,
      description,
      icon,
      coverPhoto,
      type: type || 'public',
      allowMemberPosts: allowMemberPosts !== undefined ? allowMemberPosts : true,
      allowMemberEvents: allowMemberEvents !== undefined ? allowMemberEvents : true,
      administrators: groupAdministrators,
      members: members || []
    });

    await group.save();
    res.status(201).json({ message: 'Groupe créé avec succès', group });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du groupe', error: error.message });
  }
};

// Obtenir tous les groupes (selon le type et l'appartenance)
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { type: 'public' },
        { members: req.user._id },
        { administrators: req.user._id }
      ]
    })
      .populate('administrators', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des groupes', error: error.message });
  }
};

// Obtenir un groupe par ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('administrators', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    if (!group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }

    // Vérifier l'accès pour les groupes privés/secrets
    if (group.type === 'secret' || group.type === 'private') {
      const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
      const isAdmin = group.administrators.some(a => a._id.toString() === req.user._id.toString());
      if (!isMember && !isAdmin) {
        return res.status(403).json({ message: 'Accès refusé à ce groupe' });
      }
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du groupe', error: error.message });
  }
};

// Mettre à jour un groupe
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }

    // Vérifier que l'utilisateur est administrateur
    const isAdmin = group.administrators.some(a => a.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent modifier le groupe' });
    }

    const updates = req.body;
    // Empêcher la suppression de tous les administrateurs
    if (updates.administrators && updates.administrators.length === 0) {
      return res.status(400).json({ message: 'Un groupe doit avoir au moins un administrateur' });
    }

    Object.assign(group, updates);
    await group.save();

    res.json({ message: 'Groupe mis à jour avec succès', group });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du groupe', error: error.message });
  }
};

// Supprimer un groupe
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }

    // Vérifier que l'utilisateur est administrateur
    const isAdmin = group.administrators.some(a => a.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent supprimer le groupe' });
    }

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Groupe supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du groupe', error: error.message });
  }
};

// Rejoindre un groupe
exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }

    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous êtes déjà membre de ce groupe' });
    }

    if (group.administrators.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous êtes déjà administrateur de ce groupe' });
    }

    group.members.push(req.user._id);
    await group.save();

    res.json({ message: 'Vous avez rejoint le groupe avec succès', group });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'adhésion au groupe', error: error.message });
  }
};

// Quitter un groupe
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }

    // Ne pas permettre aux administrateurs de quitter s'ils sont les seuls
    if (group.administrators.includes(req.user._id)) {
      if (group.administrators.length === 1) {
        return res.status(400).json({ message: 'Vous ne pouvez pas quitter le groupe car vous êtes le seul administrateur' });
      }
      // Retirer de la liste des administrateurs
      group.administrators = group.administrators.filter(a => a.toString() !== req.user._id.toString());
    }

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();

    res.json({ message: 'Vous avez quitté le groupe avec succès', group });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la sortie du groupe', error: error.message });
  }
};

// Ajouter un administrateur
exports.addAdministrator = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }

    const isAdmin = group.administrators.some(a => a.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent ajouter d\'autres administrateurs' });
    }

    if (group.administrators.includes(userId)) {
      return res.status(400).json({ message: 'Cet utilisateur est déjà administrateur' });
    }

    group.administrators.push(userId);
    // Retirer de la liste des membres s'il y est
    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();

    res.json({ message: 'Administrateur ajouté avec succès', group });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'administrateur', error: error.message });
  }
};

// Obtenir les événements d'un groupe
exports.getGroupEvents = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }

    const events = await Event.find({ groupId: req.params.id })
      .populate('organizers', 'firstName lastName email')
      .populate('participants', 'firstName lastName email')
      .sort({ startDate: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des événements', error: error.message });
  }
};
