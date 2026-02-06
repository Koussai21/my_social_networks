const express = require('express');
const router = express.Router();
const carpoolingController = require('../controllers/carpoolingController');
const auth = require('../middleware/auth');
const { validateCarpooling } = require('../middleware/validators');

// Toutes les routes nécessitent une authentification
router.use(auth);

router.post('/', validateCarpooling, carpoolingController.createCarpooling);
router.get('/event/:eventId', carpoolingController.getEventCarpoolings);
router.post('/:id/join', carpoolingController.joinCarpooling);
router.post('/:id/leave', carpoolingController.leaveCarpooling);
router.put('/:id', validateCarpooling, carpoolingController.updateCarpooling);
router.delete('/:id', carpoolingController.deleteCarpooling);

module.exports = router;
