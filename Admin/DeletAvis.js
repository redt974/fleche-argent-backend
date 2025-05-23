const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Supprimer un utilisateur
router.post("/", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID est requis" });
  }

  try {
    const result = await db.query(
      "DELETE FROM avis WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Avis non trouvé" });
    }
    res.status(200).json({
      message: "Avis supprimé avec succès",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

module.exports = router;
