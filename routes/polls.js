const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const auth = require('../middleware/auth');
const { validatePoll } = require('../middleware/validators');

// Toutes les routes nécessitent une authentification
router.use(auth);

router.post('/', validatePoll, pollController.createPoll);
router.get('/event/:eventId', pollController.getEventPolls);
router.get('/:id', pollController.getPoll);
router.post('/:id/answer', pollController.answerPoll);
router.delete('/:id', pollController.deletePoll);

module.exports = router;
