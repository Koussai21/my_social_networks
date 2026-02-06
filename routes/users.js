const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validators');

// Routes publiques
router.post('/register', validateUserRegistration, userController.register);
router.post('/login', validateUserLogin, userController.login);

// Routes protégées
router.get('/profile', auth, userController.getProfile);
router.get('/:id', auth, userController.getUserById);
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
