const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Middleware d'authentification (si nécessaire)
// const authMiddleware = require("../auth/middleware");
// router.use(authMiddleware);

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  // Vérification que l'userId est un nombre entier
  if (!userId || isNaN(parseInt(userId))) {
    return res.status(400).json({ message: "ID utilisateur invalide" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM utilisateurs WHERE id = $1",
      [parseInt(userId)] // Utilise l'ID de l'utilisateur avec une conversion en entier
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ user: result.rows[0] }, "ici"); // Retourne un seul utilisateur pour plus de clarté
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
});

module.exports = router;
