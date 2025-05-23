const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../auth/middleware");

router.get("/", async (req, res) => {
  try {
    const users = await db.query("SELECT * FROM utilisateurs");
    res.status(200).json(users.rows);
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    res
      .status(500)
      .json({ message: "Erreur interne du serveur", error: err.message });
  }
});

module.exports = router;
