# API My Social Network

API REST complète pour un réseau social avec gestion d'événements, groupes, discussions, albums photo, sondages et billetterie.

## Table des matières

- [Installation](#installation)
- [Configuration](#configuration)
- [Authentification](#authentification)
- [Endpoints](#endpoints)
  - [Utilisateurs](#utilisateurs)
  - [Événements](#événements)
  - [Groupes](#groupes)
  - [Discussions](#discussions)
  - [Albums Photo](#albums-photo)
  - [Sondages](#sondages)
  - [Billetterie](#billetterie)
  - [Shopping List (Bonus)](#shopping-list-bonus)
  - [Covoiturage (Bonus)](#covoiturage-bonus)

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur
npm start

# Démarrer en mode développement (avec nodemon)
npm run dev
```

## ⚙️ Configuration

Le fichier `.env` contient les variables d'environnement nécessaires :

```
PORT=3000
MONGODB_URI=mongodb+srv://xena_db_user:Z5qWuuJYPJnPHZPv@mysocialnetwork.zjjzpng.mongodb.net/
DB_NAME=mysocialnetwork
JWT_SECRET=your-secret-key-change-in-production
```

## Authentification

La plupart des endpoints nécessitent une authentification via JWT. Pour obtenir un token :

1. **Inscription** : `POST /api/users/register`
2. **Connexion** : `POST /api/users/login`

Le token doit être inclus dans le header `Authorization` :
```
Authorization: Bearer <votre-token>
```

## Endpoints

### Utilisateurs

#### Inscription
```
POST /api/users/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01", // optionnel
  "bio": "Ma bio" // optionnel
}
```

#### Connexion
```
POST /api/users/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
```

#### Obtenir son profil
```
GET /api/users/profile
Headers: Authorization: Bearer <token>
```

#### Obtenir un utilisateur par ID
```
GET /api/users/:id
Headers: Authorization: Bearer <token>
```

#### Mettre à jour son profil
```
PUT /api/users/profile
Headers: Authorization: Bearer <token>
Body: {
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Nouvelle bio"
}
```

### Événements

#### Créer un événement
```
POST /api/events
Headers: Authorization: Bearer <token>
Body: {
  "name": "Concert de rock",
  "description": "Un super concert",
  "startDate": "2026-03-15T20:00:00Z",
  "endDate": "2026-03-15T23:00:00Z",
  "location": "Paris, France",
  "coverPhoto": "https://example.com/photo.jpg", // optionnel
  "isPrivate": false, // optionnel, défaut: false
  "organizers": ["userId1", "userId2"], // optionnel
  "participants": ["userId3"], // optionnel
  "groupId": "groupId" // optionnel
}
```

#### Obtenir tous les événements
```
GET /api/events
Headers: Authorization: Bearer <token>
```

#### Obtenir un événement par ID
```
GET /api/events/:id
Headers: Authorization: Bearer <token>
```

#### Mettre à jour un événement
```
PUT /api/events/:id
Headers: Authorization: Bearer <token>
Body: { /* mêmes champs que création */ }
```

#### Supprimer un événement
```
DELETE /api/events/:id
Headers: Authorization: Bearer <token>
```

#### Rejoindre un événement
```
POST /api/events/:id/join
Headers: Authorization: Bearer <token>
```

#### Quitter un événement
```
POST /api/events/:id/leave
Headers: Authorization: Bearer <token>
```

#### Activer/désactiver la shopping list
```
POST /api/events/:id/toggle-shopping-list
Headers: Authorization: Bearer <token>
```

#### Activer/désactiver le covoiturage
```
POST /api/events/:id/toggle-carpooling
Headers: Authorization: Bearer <token>
```

### Groupes

#### Créer un groupe
```
POST /api/groups
Headers: Authorization: Bearer <token>
Body: {
  "name": "Groupe de musique",
  "description": "Discussion sur la musique",
  "icon": "https://example.com/icon.png", // optionnel
  "coverPhoto": "https://example.com/cover.jpg", // optionnel
  "type": "public", // "public", "private", ou "secret"
  "allowMemberPosts": true, // optionnel, défaut: true
  "allowMemberEvents": true, // optionnel, défaut: true
  "administrators": ["userId1"], // optionnel
  "members": ["userId2"] // optionnel
}
```

#### Obtenir tous les groupes
```
GET /api/groups
Headers: Authorization: Bearer <token>
```

#### Obtenir un groupe par ID
```
GET /api/groups/:id
Headers: Authorization: Bearer <token>
```

#### Mettre à jour un groupe
```
PUT /api/groups/:id
Headers: Authorization: Bearer <token>
Body: { /* mêmes champs que création */ }
```

#### Supprimer un groupe
```
DELETE /api/groups/:id
Headers: Authorization: Bearer <token>
```

#### Rejoindre un groupe
```
POST /api/groups/:id/join
Headers: Authorization: Bearer <token>
```

#### Quitter un groupe
```
POST /api/groups/:id/leave
Headers: Authorization: Bearer <token>
```

#### Ajouter un administrateur
```
POST /api/groups/:id/administrators
Headers: Authorization: Bearer <token>
Body: {
  "userId": "userId"
}
```

#### Obtenir les événements d'un groupe
```
GET /api/groups/:id/events
Headers: Authorization: Bearer <token>
```

### Discussions

#### Créer une discussion
```
POST /api/discussions
Headers: Authorization: Bearer <token>
Body: {
  "groupId": "groupId", // soit groupId soit eventId, pas les deux
  "eventId": null
}
```

#### Obtenir une discussion avec ses messages
```
GET /api/discussions/:id
Headers: Authorization: Bearer <token>
```

#### Créer un message
```
POST /api/discussions/:discussionId/messages
Headers: Authorization: Bearer <token>
Body: {
  "content": "Mon message",
  "parentMessageId": "messageId" // optionnel, pour répondre à un message
}
```

#### Mettre à jour un message
```
PUT /api/discussions/:discussionId/messages/:messageId
Headers: Authorization: Bearer <token>
Body: {
  "content": "Message modifié"
}
```

#### Supprimer un message
```
DELETE /api/discussions/:discussionId/messages/:messageId
Headers: Authorization: Bearer <token>
```

### Albums Photo

#### Créer un album
```
POST /api/albums
Headers: Authorization: Bearer <token>
Body: {
  "eventId": "eventId",
  "name": "Photos du concert",
  "description": "Toutes les photos" // optionnel
}
```

#### Obtenir tous les albums d'un événement
```
GET /api/albums/event/:eventId
Headers: Authorization: Bearer <token>
```

#### Obtenir un album avec ses photos
```
GET /api/albums/:id
Headers: Authorization: Bearer <token>
```

#### Ajouter une photo
```
POST /api/albums/:albumId/photos
Headers: Authorization: Bearer <token>
Body: {
  "url": "https://example.com/photo.jpg"
}
```

#### Commenter une photo
```
POST /api/albums/photos/:photoId/comments
Headers: Authorization: Bearer <token>
Body: {
  "content": "Super photo !"
}
```

#### Supprimer une photo
```
DELETE /api/albums/photos/:photoId
Headers: Authorization: Bearer <token>
```

### Sondages

#### Créer un sondage
```
POST /api/polls
Headers: Authorization: Bearer <token>
Body: {
  "eventId": "eventId",
  "title": "Sondage sur le menu",
  "questions": [
    {
      "question": "Quel plat préférez-vous ?",
      "options": ["Pizza", "Pasta", "Salade"]
    },
    {
      "question": "Quel dessert ?",
      "options": ["Glace", "Tarte", "Fruits"]
    }
  ]
}
```

#### Obtenir tous les sondages d'un événement
```
GET /api/polls/event/:eventId
Headers: Authorization: Bearer <token>
```

#### Obtenir un sondage par ID
```
GET /api/polls/:id
Headers: Authorization: Bearer <token>
```

#### Répondre à un sondage
```
POST /api/polls/:id/answer
Headers: Authorization: Bearer <token>
Body: {
  "answers": [
    {
      "questionIndex": 0,
      "selectedOption": "Pizza"
    },
    {
      "questionIndex": 1,
      "selectedOption": "Glace"
    }
  ]
}
```

#### Supprimer un sondage
```
DELETE /api/polls/:id
Headers: Authorization: Bearer <token>
```

### Billetterie

#### Créer un type de billet
```
POST /api/tickets/types
Headers: Authorization: Bearer <token>
Body: {
  "eventId": "eventId",
  "name": "Billet Standard",
  "amount": 25.50,
  "quantityLimit": 100
}
```

#### Obtenir tous les types de billets d'un événement
```
GET /api/tickets/types/event/:eventId
Headers: Authorization: Bearer <token>
```

#### Acheter un billet (route publique)
```
POST /api/tickets/purchase
Body: {
  "ticketTypeId": "ticketTypeId",
  "buyerFirstName": "Jean",
  "buyerLastName": "Dupont",
  "buyerAddress": "123 Rue de la Paix, 75001 Paris"
}
```

#### Obtenir tous les billets d'un événement (organisateurs uniquement)
```
GET /api/tickets/event/:eventId
Headers: Authorization: Bearer <token>
```

#### Mettre à jour un type de billet
```
PUT /api/tickets/types/:id
Headers: Authorization: Bearer <token>
Body: {
  "name": "Nouveau nom",
  "amount": 30.00,
  "quantityLimit": 150
}
```

#### Supprimer un type de billet
```
DELETE /api/tickets/types/:id
Headers: Authorization: Bearer <token>
```

### Shopping List (Bonus)

#### Ajouter un article
```
POST /api/shopping-list
Headers: Authorization: Bearer <token>
Body: {
  "eventId": "eventId",
  "name": "Pizza",
  "quantity": 3,
  "arrivalTime": "2026-03-15T19:00:00Z"
}
```

#### Obtenir tous les articles d'un événement
```
GET /api/shopping-list/event/:eventId
Headers: Authorization: Bearer <token>
```

#### Mettre à jour un article
```
PUT /api/shopping-list/:id
Headers: Authorization: Bearer <token>
Body: {
  "quantity": 5,
  "arrivalTime": "2026-03-15T19:30:00Z"
}
```

#### Supprimer un article
```
DELETE /api/shopping-list/:id
Headers: Authorization: Bearer <token>
```

### Covoiturage (Bonus)

#### Créer une offre de covoiturage
```
POST /api/carpooling
Headers: Authorization: Bearer <token>
Body: {
  "eventId": "eventId",
  "departureLocation": "Lyon, France",
  "departureTime": "2026-03-15T18:00:00Z",
  "price": 15.00,
  "availableSeats": 3,
  "maxTimeDeviation": 30 // en minutes
}
```

#### Obtenir toutes les offres d'un événement
```
GET /api/carpooling/event/:eventId
Headers: Authorization: Bearer <token>
```

#### Rejoindre un covoiturage
```
POST /api/carpooling/:id/join
Headers: Authorization: Bearer <token>
```

#### Quitter un covoiturage
```
POST /api/carpooling/:id/leave
Headers: Authorization: Bearer <token>
```

#### Mettre à jour une offre
```
PUT /api/carpooling/:id
Headers: Authorization: Bearer <token>
Body: { /* mêmes champs que création */ }
```

#### Supprimer une offre
```
DELETE /api/carpooling/:id
Headers: Authorization: Bearer <token>
```

## Sécurité

- Les mots de passe sont hashés avec bcrypt
- Authentification JWT pour protéger les routes
- Validation des données d'entrée avec express-validator
- Vérification des permissions (organisateurs, administrateurs, participants)

## Notes importantes

- Un utilisateur ne peut pas avoir le même email qu'un autre utilisateur
- Un événement doit avoir au moins un organisateur
- Un groupe doit avoir au moins un administrateur
- Une discussion est liée soit à un groupe, soit à un événement, mais pas les deux
- La billetterie n'est disponible que pour les événements publics
- Une personne ne peut acheter qu'un seul billet par événement (vérifié par nom/prénom/adresse)
- Les articles de la shopping list sont uniques par événement
- Les organisateurs peuvent activer/désactiver la shopping list et le covoiturage pour leurs événements

## Technologies utilisées

- Node.js
- Express.js
- MongoDB / Mongoose
- JWT pour l'authentification
- bcryptjs pour le hashage des mots de passe
- express-validator pour la validation
- CORS pour gérer les requêtes cross-origin

