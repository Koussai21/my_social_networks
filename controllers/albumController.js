const Album = require('../models/Album');
const Photo = require('../models/Photo');
const Event = require('../models/Event');

// Créer un album
exports.createAlbum = async (req, res) => {
  try {
    const { eventId, name, description } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                         event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'Seuls les participants peuvent créer des albums' });
    }

    const album = new Album({
      eventId,
      name,
      description
    });

    await album.save();
    res.status(201).json({ message: 'Album créé avec succès', album });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'album', error: error.message });
  }
};

// Obtenir tous les albums d'un événement
exports.getEventAlbums = async (req, res) => {
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

    const albums = await Album.find({ eventId: req.params.eventId })
      .populate('photos')
      .sort({ createdAt: -1 });

    res.json(albums);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des albums', error: error.message });
  }
};

// Obtenir un album avec ses photos
exports.getAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate('eventId', 'name isPrivate');

    if (!album) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    const event = await Event.findById(album.eventId._id);
    if (event.isPrivate) {
      const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                           event.organizers.some(o => o.toString() === req.user._id.toString());
      if (!isParticipant) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    const photos = await Photo.find({ albumId: req.params.id })
      .populate('postedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ album, photos });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'album', error: error.message });
  }
};

// Ajouter une photo à un album
exports.addPhoto = async (req, res) => {
  try {
    const { url } = req.body;
    const albumId = req.params.albumId;

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album non trouvé' });
    }

    const event = await Event.findById(album.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                         event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'Seuls les participants peuvent ajouter des photos' });
    }

    const photo = new Photo({
      albumId,
      eventId: album.eventId,
      postedBy: req.user._id,
      url
    });

    await photo.save();

    // Ajouter la photo à l'album
    album.photos.push(photo._id);
    await album.save();

    const populatedPhoto = await Photo.findById(photo._id)
      .populate('postedBy', 'firstName lastName email');

    res.status(201).json({ message: 'Photo ajoutée avec succès', photo: populatedPhoto });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout de la photo', error: error.message });
  }
};

// Commenter une photo
exports.commentPhoto = async (req, res) => {
  try {
    const { content } = req.body;
    const photoId = req.params.photoId;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }

    const event = await Event.findById(photo.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = event.participants.some(p => p.toString() === req.user._id.toString()) ||
                         event.organizers.some(o => o.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'Seuls les participants peuvent commenter les photos' });
    }

    photo.comments.push({
      author: req.user._id,
      content
    });

    await photo.save();

    const populatedPhoto = await Photo.findById(photoId)
      .populate('postedBy', 'firstName lastName email')
      .populate('comments.author', 'firstName lastName email');

    res.json({ message: 'Commentaire ajouté avec succès', photo: populatedPhoto });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire', error: error.message });
  }
};

// Supprimer une photo
exports.deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }

    // Vérifier que l'utilisateur est l'auteur ou un organisateur
    const event = await Event.findById(photo.eventId);
    const isAuthor = photo.postedBy.toString() === req.user._id.toString();
    const isOrganizer = event.organizers.some(o => o.toString() === req.user._id.toString());

    if (!isAuthor && !isOrganizer) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres photos' });
    }

    // Retirer la photo de l'album
    const album = await Album.findById(photo.albumId);
    if (album) {
      album.photos = album.photos.filter(p => p.toString() !== photo._id.toString());
      await album.save();
    }

    await Photo.findByIdAndDelete(req.params.photoId);
    res.json({ message: 'Photo supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la photo', error: error.message });
  }
};
