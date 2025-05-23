const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// Mettre à jour un utilisateur par ID
router.post("/:id", async (req, res) => {
  const { id } = req.params;
  const { nom, email, telephone, adresse } = req.body;

  if (!nom || !email || !telephone || !adresse) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  try {
    const result = await pool.query(
      `UPDATE utilisateurs 
       SET nom = $1, email = $2, telephone = $3, adresse = $4
       WHERE id = $5 
       RETURNING *`,
      [nom, email, telephone, adresse, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({
      message: "Utilisateur mis à jour avec succès",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
