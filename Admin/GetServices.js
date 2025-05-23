const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/:service", async (req, res) => {
  const { service } = req.params;
  try {
    const validServices = ["chambre", "restaurant", "spa"];
    if (!validServices.includes(service)) {
      return res.status(400).json({ message: "Service invalide" });
    }

    const reservations = await db.query(
      `
      SELECT 
        reservation.id,
        reservation.user_id,
        reservation.date::DATE AS date,       -- Formater la date en "YYYY-MM-DD"
        TO_CHAR(reservation.horaire, 'HH24:MI') AS horaire, -- Formater l'heure en "HH:MM"
        reservation.prix,
        service.nom AS service
      FROM reservation
      JOIN service ON reservation.service_id = service.id
      WHERE service.nom = $1
      `,
      [service]
    );

    res.status(200).json(reservations.rows);
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
});

module.exports = router;
