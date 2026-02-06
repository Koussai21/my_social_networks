const { body, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validators pour les utilisateurs
const validateUserRegistration = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
  handleValidationErrors
];

// Validators pour les événements
const validateEvent = [
  body('name').notEmpty().withMessage('Le nom de l\'événement est requis'),
  body('description').notEmpty().withMessage('La description est requise'),
  body('startDate').isISO8601().withMessage('Date de début invalide'),
  body('endDate').isISO8601().withMessage('Date de fin invalide'),
  body('location').notEmpty().withMessage('Le lieu est requis'),
  handleValidationErrors
];

// Validators pour les groupes
const validateGroup = [
  body('name').notEmpty().withMessage('Le nom du groupe est requis'),
  body('description').notEmpty().withMessage('La description est requise'),
  body('type').isIn(['public', 'private', 'secret']).withMessage('Type de groupe invalide'),
  handleValidationErrors
];

// Validators pour les messages
const validateMessage = [
  body('content').notEmpty().trim().withMessage('Le contenu du message est requis'),
  handleValidationErrors
];

// Validators pour les sondages
const validatePoll = [
  body('title').notEmpty().withMessage('Le titre du sondage est requis'),
  body('questions').isArray({ min: 1 }).withMessage('Au moins une question est requise'),
  body('questions.*.question').notEmpty().withMessage('Chaque question doit avoir un texte'),
  body('questions.*.options').isArray({ min: 2 }).withMessage('Chaque question doit avoir au moins 2 options'),
  handleValidationErrors
];

// Validators pour les types de billets
const validateTicketType = [
  body('name').notEmpty().withMessage('Le nom du type de billet est requis'),
  body('amount').isFloat({ min: 0 }).withMessage('Le montant doit être un nombre positif'),
  body('quantityLimit').isInt({ min: 1 }).withMessage('La quantité limitée doit être un entier positif'),
  handleValidationErrors
];

// Validators pour les billets
const validateTicket = [
  body('ticketTypeId').isMongoId().withMessage('ID de type de billet invalide'),
  body('buyerFirstName').notEmpty().withMessage('Le prénom est requis'),
  body('buyerLastName').notEmpty().withMessage('Le nom est requis'),
  body('buyerAddress').notEmpty().withMessage('L\'adresse complète est requise'),
  handleValidationErrors
];

// Validators pour la shopping list
const validateShoppingListItem = [
  body('name').notEmpty().withMessage('Le nom de l\'article est requis'),
  body('quantity').isInt({ min: 1 }).withMessage('La quantité doit être un entier positif'),
  body('arrivalTime').isISO8601().withMessage('Heure d\'arrivée invalide'),
  handleValidationErrors
];

// Validators pour le covoiturage
const validateCarpooling = [
  body('departureLocation').notEmpty().withMessage('Le lieu de départ est requis'),
  body('departureTime').isISO8601().withMessage('Heure de départ invalide'),
  body('price').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('availableSeats').isInt({ min: 1 }).withMessage('Le nombre de places doit être un entier positif'),
  body('maxTimeDeviation').isInt({ min: 0 }).withMessage('Le temps d\'écart doit être un nombre positif'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateEvent,
  validateGroup,
  validateMessage,
  validatePoll,
  validateTicketType,
  validateTicket,
  validateShoppingListItem,
  validateCarpooling
};
