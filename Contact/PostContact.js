const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Import de la configuration PostgreSQL

// Endpoint pour insérer les données du formulaire de contact
router.post("/", async (req, res) => {
  const { nom, prenom, entreprise, email, pays, sujet, message } = req.body;

  // Validation des données
  if (!nom || !prenom || !email || !pays || !sujet || !message) {
    return res
      .status(400)
      .json({ message: "Tous les champs obligatoires doivent être remplis." });
  }

  try {
    const query = `
      INSERT INTO contacts (nom, prenom, entreprise, email, pays, sujet, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;
    const values = [nom, prenom, entreprise, email, pays, sujet, message];

    const result = await db.query(query, values);

    res.status(201).json({
      message: "Les données du formulaire ont été enregistrées avec succès.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    res
      .status(500)
      .json({ message: "Erreur interne du serveur", error: err.message });
  }
});

module.exports = router;
