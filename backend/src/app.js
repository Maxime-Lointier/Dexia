// Point d'entrée principal du serveur Express
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Exemple de route racine
app.get('/', (req, res) => {
  res.send('API Backend Dexia opérationnelle');
});

// Import des routes
const moviesRoutes = require('./routes/moviesRoutes');
const userRoutes = require('./routes/userRoutes');
const interactionRoutes = require('./routes/interactionRoutes');

// Montage des routes (préfixe commun /api)
app.use('/api', moviesRoutes);
app.use('/api', userRoutes);
app.use('/api', interactionRoutes);

app.listen(PORT, () => {
  console.log(`Serveur backend lancé sur le port ${PORT}`);
});
