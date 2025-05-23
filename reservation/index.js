const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// Récupérer la liste des services disponibles
router.get("/services", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM service");
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur lors de la récupération des services:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Vérifier la disponibilité d'un service pour une date et un horaire
router.get("/disponibilite", async (req, res) => {
  const { service_id, date, horaire } = req.query;

  if (!service_id || !date || !horaire) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  try {
    const result = await pool.query(
      `SELECT COALESCE(nombre_disponible, 0) AS nombre_disponible 
           FROM disponibilite WHERE service_id = $1 AND date = $2 AND horaire = $3`,
      [service_id, date, horaire]
    );

    res.json(result.rows[0] || { nombre_disponible: 0 });
  } catch (err) {
    console.error("Erreur lors de la vérification de la disponibilité:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer une réservation
router.post("/create", async (req, res) => {
  const { user_id, service_id, date, horaire, prix } = req.body;

  if (!user_id || !service_id || !date || !horaire || !prix) {
    console.log(req.body);
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  try {
    // Vérifier la disponibilité du service
    const result = await pool.query(
      `SELECT nombre_disponible FROM disponibilite WHERE service_id = $1 AND date = $2 AND horaire = $3`,
      [service_id, date, horaire]
    );

    if (result.rows.length === 0 || result.rows[0].nombre_disponible === 0) {
      console.log("Service non disponible pour ce créneau");
      return res
        .status(400)
        .json({ error: "Service non disponible pour ce créneau" });
    }

    // Insérer la réservation
    const reservationResult = await pool.query(
      `INSERT INTO reservation (user_id, service_id, date, horaire, prix) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, service_id, date, horaire, prix]
    );

    // Mettre à jour la disponibilité
    const updateResult = await pool.query(
      `UPDATE disponibilite SET nombre_disponible = nombre_disponible - 1 
      WHERE service_id = $1 AND date = $2 AND horaire = $3`,
      [service_id, date, horaire]
    );

    res.status(201).json(reservationResult.rows[0]);
  } catch (err) {
    console.error("Erreur lors de la création de la réservation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer les réservations d'un utilisateur
router.get("/get", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "Paramètre 'user_id' manquant" });
  }

  try {
    const result = await pool.query(
      `SELECT r.id, r.date, r.horaire, r.prix, s.nom AS service_nom, s.type AS service_type
      FROM reservation r
      JOIN service s ON r.service_id = s.id
      WHERE r.user_id = $1`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur lors de la récupération des réservations:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
