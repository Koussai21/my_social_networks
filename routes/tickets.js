const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const { validateTicketType, validateTicket } = require('../middleware/validators');

// Route publique pour acheter un billet
router.post('/purchase', validateTicket, ticketController.purchaseTicket);

// Routes protégées
router.use(auth);

router.post('/types', validateTicketType, ticketController.createTicketType);
router.get('/types/event/:eventId', ticketController.getEventTicketTypes);
router.put('/types/:id', validateTicketType, ticketController.updateTicketType);
router.delete('/types/:id', ticketController.deleteTicketType);
router.get('/event/:eventId', ticketController.getEventTickets);

module.exports = router;
