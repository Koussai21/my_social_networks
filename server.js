const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const groupRoutes = require('./routes/groups');
const discussionRoutes = require('./routes/discussions');
const albumRoutes = require('./routes/albums');
const pollRoutes = require('./routes/polls');
const ticketRoutes = require('./routes/tickets');
const shoppingListRoutes = require('./routes/shoppingList');
const carpoolingRoutes = require('./routes/carpooling');

app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/shopping-list', shoppingListRoutes);
app.use('/api/carpooling', carpoolingRoutes);

// Connexion MongoDB
const MONGODB_URI = `${process.env.MONGODB_URI}${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connexion à MongoDB réussie');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erreur de connexion à MongoDB:', error);
  });

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API My Social Network - Bienvenue !' });
});

module.exports = app;
