const Discussion = require('../models/Discussion');
const Message = require('../models/Message');
const Group = require('../models/Group');
const Event = require('../models/Event');

// Créer une discussion
exports.createDiscussion = async (req, res) => {
  try {
    const { groupId, eventId } = req.body;

    if (!groupId && !eventId) {
      return res.status(400).json({ message: 'Une discussion doit être liée à un groupe ou un événement' });
    }

    if (groupId && eventId) {
      return res.status(400).json({ message: 'Une discussion ne peut pas être liée à la fois à un groupe et un événement' });
    }

    // Vérifier l'accès au groupe ou à l'événement
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Groupe non trouvé' });
      }
      const isMember = group.members.some(m => m.toString() === req.user._id.toString()) ||
                      group.administrators.some(a => a.toString() === req.user._id.toString());
      if (!isMember && group.type !== 'public') {
        return res.status(403).json({ message: 'Accès refusé à ce groupe' });
      }
    }

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }
      const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                           event.organizers.some(o => o.toString() === req.user._id.toString());
      if (!isParticipant && event.isPrivate) {
        return res.status(403).json({ message: 'Accès refusé à cet événement' });
      }
    }

    const discussion = new Discussion({
      groupId: groupId || null,
      eventId: eventId || null
    });

    await discussion.save();
    res.status(201).json({ message: 'Discussion créée avec succès', discussion });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la discussion', error: error.message });
  }
};

// Obtenir une discussion avec ses messages
exports.getDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('groupId', 'name type')
      .populate('eventId', 'name');

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion non trouvée' });
    }

    // Vérifier l'accès
    if (discussion.groupId) {
      const group = await Group.findById(discussion.groupId._id);
      const isMember = group.members.some(m => m.toString() === req.user._id.toString()) ||
                      group.administrators.some(a => a.toString() === req.user._id.toString());
      if (!isMember && group.type !== 'public') {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    if (discussion.eventId) {
      const event = await Event.findById(discussion.eventId._id);
      const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                           event.organizers.some(o => o.toString() === req.user._id.toString());
      if (!isParticipant && event.isPrivate) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    const messages = await Message.find({ discussionId: req.params.id })
      .populate('author', 'firstName lastName email')
      .populate('replies')
      .populate('parentMessage')
      .sort({ createdAt: 1 });

    res.json({ discussion, messages });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la discussion', error: error.message });
  }
};

// Créer un message dans une discussion
exports.createMessage = async (req, res) => {
  try {
    const { content, parentMessageId } = req.body;
    const discussionId = req.params.discussionId;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion non trouvée' });
    }

    // Vérifier l'accès
    if (discussion.groupId) {
      const group = await Group.findById(discussion.groupId);
      if (!group) {
        return res.status(404).json({ message: 'Groupe non trouvé' });
      }
      if (!group.allowMemberPosts) {
        const isAdmin = group.administrators.some(a => a.toString() === req.user._id.toString());
        if (!isAdmin) {
          return res.status(403).json({ message: 'Les membres ne peuvent pas publier dans ce groupe' });
        }
      }
    }

    const message = new Message({
      discussionId,
      author: req.user._id,
      content,
      parentMessage: parentMessageId || null
    });

    await message.save();

    // Ajouter le message à la discussion
    discussion.messages.push(message._id);
    await discussion.save();

    // Si c'est une réponse, l'ajouter au message parent
    if (parentMessageId) {
      const parentMessage = await Message.findById(parentMessageId);
      if (parentMessage) {
        parentMessage.replies.push(message._id);
        await parentMessage.save();
      }
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('author', 'firstName lastName email');

    res.status(201).json({ message: 'Message créé avec succès', message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du message', error: error.message });
  }
};

// Mettre à jour un message
exports.updateMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier que l'auteur est celui qui modifie
    if (message.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres messages' });
    }

    message.content = req.body.content;
    message.updatedAt = new Date();
    await message.save();

    res.json({ message: 'Message mis à jour avec succès', message });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du message', error: error.message });
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier que l'auteur est celui qui supprime
    if (message.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres messages' });
    }

    // Retirer le message de la discussion
    const discussion = await Discussion.findById(message.discussionId);
    if (discussion) {
      discussion.messages = discussion.messages.filter(m => m.toString() !== message._id.toString());
      await discussion.save();
    }

    // Retirer le message des réponses du message parent
    if (message.parentMessage) {
      const parentMessage = await Message.findById(message.parentMessage);
      if (parentMessage) {
        parentMessage.replies = parentMessage.replies.filter(r => r.toString() !== message._id.toString());
        await parentMessage.save();
      }
    }

    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du message', error: error.message });
  }
};
