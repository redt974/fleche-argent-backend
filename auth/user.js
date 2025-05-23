const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../authentification/middleware");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM utilisateurs", [
      req.user.userId,
    ]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.status(200).json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

module.exports = router;
