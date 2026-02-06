const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const auth = require('../middleware/auth');
const { validateMessage } = require('../middleware/validators');

// Toutes les routes nécessitent une authentification
router.use(auth);

router.post('/', discussionController.createDiscussion);
router.get('/:id', discussionController.getDiscussion);
router.post('/:discussionId/messages', validateMessage, discussionController.createMessage);
router.put('/:discussionId/messages/:messageId', validateMessage, discussionController.updateMessage);
router.delete('/:discussionId/messages/:messageId', discussionController.deleteMessage);

module.exports = router;
