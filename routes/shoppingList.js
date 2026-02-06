const express = require('express');
const router = express.Router();
const shoppingListController = require('../controllers/shoppingListController');
const auth = require('../middleware/auth');
const { validateShoppingListItem } = require('../middleware/validators');

// Toutes les routes nécessitent une authentification
router.use(auth);

router.post('/', validateShoppingListItem, shoppingListController.addItem);
router.get('/event/:eventId', shoppingListController.getEventItems);
router.put('/:id', validateShoppingListItem, shoppingListController.updateItem);
router.delete('/:id', shoppingListController.deleteItem);

module.exports = router;
