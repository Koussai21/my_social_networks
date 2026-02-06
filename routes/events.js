const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');
const { validateEvent } = require('../middleware/validators');

// Toutes les routes nécessitent une authentification
router.use(auth);

router.post('/', validateEvent, eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', validateEvent, eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.post('/:id/join', eventController.joinEvent);
router.post('/:id/leave', eventController.leaveEvent);
router.post('/:id/toggle-shopping-list', eventController.toggleShoppingList);
router.post('/:id/toggle-carpooling', eventController.toggleCarpooling);

module.exports = router;
