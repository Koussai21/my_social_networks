const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');
const { validateGroup } = require('../middleware/validators');

// Toutes les routes nécessitent une authentification
router.use(auth);

router.post('/', validateGroup, groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:id', groupController.getGroupById);
router.put('/:id', validateGroup, groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);
router.post('/:id/join', groupController.joinGroup);
router.post('/:id/leave', groupController.leaveGroup);
router.post('/:id/administrators', groupController.addAdministrator);
router.get('/:id/events', groupController.getGroupEvents);

module.exports = router;
