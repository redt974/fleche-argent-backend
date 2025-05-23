const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Assurez-vous que le fichier de configuration de la base de données est correct

const secretKey = process.env.JWT_SECRET;
const refreshSecretKey = process.env.REFRESH_JWT_SECRET;

// Fonction pour récupérer l'email d'un utilisateur à partir de son ID
async function getUserEmailById(userId) {
  try {
    const result = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.email || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'email:', error);
    throw new Error('Erreur interne du serveur');
  }
}

// Route pour rafraîchir le token d'accès
router.post('/', async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Récupérer le refresh token à partir du cookie

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token manquant.' });
  }

  // Vérifier le refresh token
  jwt.verify(refreshToken, refreshSecretKey, async (err, decoded) => {
    if (err) {
      console.error('Refresh token invalide:', err);
      return res.status(403).json({ message: 'Refresh token invalide.' });
    }

    try {
      // Récupérer l'email de l'utilisateur
      const email = await getUserEmailById(decoded.id);

      // Vérification du rôle admin
      const isAdmin = isOwnerEmail(email);

      // Générer un nouveau token d'accès
      const newToken = jwt.sign(
        { id: decoded.id, isAdmin },
        secretKey,
        { expiresIn: '30m' } // Token d'accès valide pendant 30 minutes
      );

      // Générer un nouveau refresh token
      const newRefreshToken = jwt.sign(
        { id: decoded.id, isAdmin },
        refreshSecretKey,
        { expiresIn: '7d' } // Refresh token valide pendant 7 jours
      );

      // Envoyer le nouveau refresh token dans un cookie HttpOnly
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Assure que le cookie est envoyé seulement en HTTPS en production
        sameSite: 'Strict', // Empêche l'envoi du cookie dans des requêtes cross-site
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
      });

      return res.status(200).json({ token: newToken });
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des tokens:', error);
      return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  });
});

module.exports = router;
