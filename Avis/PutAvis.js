const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Connexion à la base de données
const authMiddleware = require("../auth/middleware"); // Middleware d'authentification

// Récupérer tous les avis
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM avis ORDER BY date DESC");
    res.status(200).json(result.rows); // Retourne les avis sous forme de JSON
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
});

// Ajouter un avis
router.post("/", async (req, res) => {
  const { nom, commentaire, date } = req.body;

  // Validation simple des données reçues
  if (!nom || !commentaire || !date) {
    return res.status(400).json({
      message: "Tous les champs (nom, commentaire, date) sont requis.",
    });
  }

  try {
    const query = `
      INSERT INTO avis (nom, commentaire, date)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [nom, commentaire, date];
    const result = await db.query(query, values);

    res.status(201).json({
      message: "Avis ajouté avec succès.",
      avis: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
});

module.exports = router;
