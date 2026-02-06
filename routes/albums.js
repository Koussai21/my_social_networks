const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');
const auth = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

router.post('/', albumController.createAlbum);
router.get('/event/:eventId', albumController.getEventAlbums);
router.get('/:id', albumController.getAlbum);
router.post('/:albumId/photos', albumController.addPhoto);
router.post('/photos/:photoId/comments', albumController.commentPhoto);
router.delete('/photos/:photoId', albumController.deletePhoto);

module.exports = router;
