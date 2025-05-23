const { Pool } = require("pg");
require("dotenv").config();

// Création du pool de connexion PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initialisation des tables
(async () => {
  try {
    // Création de la table `utilisateurs` avec le champ sel
    await pool.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id SERIAL PRIMARY KEY,               -- ID unique pour chaque utilisateur
        nom VARCHAR(50) NOT NULL,            -- Nom de l'utilisateur
        email VARCHAR(100) UNIQUE NOT NULL,  -- Email unique de l'utilisateur
        adresse VARCHAR(100) UNIQUE NOT NULL,  -- adresse unique de l'utilisateur
        telephone int UNIQUE NOT NULL,  -- telephone unique de l'utilisateur
        password TEXT NOT NULL,              -- Mot de passe haché
        sel TEXT NOT NULL,                   -- Sel utilisé pour le hachage du mot de passe
        remember_me_token TEXT,              -- Token de "souviens-toi de moi" (optionnel)
        created_at TIMESTAMP DEFAULT NOW()   -- Date de création de l'utilisateur
      )
    `);
    console.log("Table Utilisateurs");

    // Création de la table `reset_tokens`
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,               -- Identifiant unique pour chaque reset_token
        utilisateur_id INT NOT NULL,         -- Référence à l'utilisateur
        token VARCHAR(255) NOT NULL,         -- Token de réinitialisation
        expires BIGINT NOT NULL,             -- Timestamp d'expiration
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
      )
    `);
    console.log("Table Reset_Tokens créée.");

    // Création de la table `service`
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service (
        id SERIAL PRIMARY KEY,
        nom TEXT NOT NULL,            -- 'chambre', 'table', 'spa'
        type TEXT NOT NULL,           -- 'simple', 'double', 'luxueuse', etc.
        prix DECIMAL(10, 2) NOT NULL, -- Prix du service
        nombre_disponible INT NOT NULL -- Nombre d'unités disponibles
      );
    `);
    console.log("Table Service créée.");

    // Création de la table `disponibilite`
    await pool.query(`
      CREATE TABLE IF NOT EXISTS disponibilite (
        id SERIAL PRIMARY KEY,
        service_id INT NOT NULL,
        date DATE NOT NULL,
        horaire TIME NOT NULL,
        nombre_disponible INT NOT NULL,
        FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE
      );
    `);
    console.log("Table Disponibilité créée.");

    // Création de la table `reservation`
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservation (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,           -- Référence à l'utilisateur
        service_id INT NOT NULL,        -- Référence au service
        date DATE NOT NULL,
        horaire TIME NOT NULL,
        prix DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),   -- Date de création de la reservation
        FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE,
        UNIQUE (service_id, date, horaire)  -- Assurer l'unicité de la réservation par créneau   
        );
    `);
    console.log("Table Réservation créée.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        entreprise VARCHAR(100),
        email VARCHAR(100) NOT NULL UNIQUE,
        pays VARCHAR(100) NOT NULL,
        sujet VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Table Contacts créée.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS avis (
        id SERIAL PRIMARY KEY,                    -- Identifiant unique
        nom VARCHAR(100) NOT NULL,                -- Nom de l'utilisateur
        commentaire TEXT NOT NULL,                -- Commentaire de l'utilisateur
        date DATE DEFAULT CURRENT_DATE NOT NULL,  -- Date de l'avis (par défaut la date actuelle)
        created_at TIMESTAMP DEFAULT NOW()        -- Timestamp de création
      );
    `);
    console.log("Table Avis créée.");

    // Ajout des services avec les types spécifiques
    const services = [
      // Chambres (types: Classique, Confort, Standing, Suite)
      { nom: "chambre", type: "Classique", prix: 80.0, nombre_disponible: 5 },
      { nom: "chambre", type: "Confort", prix: 100.0, nombre_disponible: 4 },
      { nom: "chambre", type: "Standing", prix: 150.0, nombre_disponible: 3 },
      { nom: "chambre", type: "Suite", prix: 250.0, nombre_disponible: 2 },

      // Tables de restaurant (types: 2, 4, 6, 8, 10 places)
      { nom: "restaurant", type: "2 places", prix: 0.0, nombre_disponible: 10 },
      { nom: "restaurant", type: "4 places", prix: 0.0, nombre_disponible: 8 },
      { nom: "restaurant", type: "6 places", prix: 0.0, nombre_disponible: 5 },
      { nom: "restaurant", type: "8 places", prix: 0.0, nombre_disponible: 4 },
      { nom: "restaurant", type: "10 places", prix: 0.0, nombre_disponible: 3 },

      // Spas (types: différents types de massages et soins)
      {
        nom: "spa",
        type: "Gommage Corps en Cabine",
        prix: 70.0,
        nombre_disponible: 6,
      },
      {
        nom: "spa",
        type: "Massage relaxant aux huiles essentielles",
        prix: 90.0,
        nombre_disponible: 6,
      },
      { nom: "spa", type: "Massage tonique", prix: 80.0, nombre_disponible: 5 },
      {
        nom: "spa",
        type: "Massage balinais",
        prix: 100.0,
        nombre_disponible: 4,
      },
      {
        nom: "spa",
        type: "Massage aux pierres chaudes",
        prix: 120.0,
        nombre_disponible: 3,
      },
    ];

    for (const service of services) {
      await pool.query(
        `
        INSERT INTO service (nom, type, prix, nombre_disponible)
        VALUES ($1, $2, $3, $4);
      `,
        [service.nom, service.type, service.prix, service.nombre_disponible]
      );
    }
    console.log("Services ajoutés.");

    // Générer les dates pour l'année suivante (exemple)
    const startDate = new Date();
    startDate.setMonth(0); // 1er Janvier
    startDate.setDate(1); // 1er Janvier
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // Ajouter un an

    // Fonction pour générer les dates d'une période donnée
    const generateDates = (startDate, endDate) => {
      const dates = [];
      let currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        dates.push(new Date(currentDate)); // Ajoute la date actuelle
        currentDate.setDate(currentDate.getDate() + 1); // Passe au jour suivant
      }

      return dates;
    };

    const dates = generateDates(startDate, endDate); // Générer toutes les dates de l'année

    // Exemple d'horaires disponibles
    const horaires = ["10:00", "14:00", "18:00"];

    // Récupérer les IDs des services et les lier aux services insérés
    const insertedServices = await pool.query(
      "SELECT id, nom, type FROM service"
    );
    const serviceMap = insertedServices.rows.reduce((map, row) => {
      const service = services.find(
        (s) => s.nom === row.nom && s.type === row.type
      );
      if (service) {
        map[row.id] = service; // Associer l'ID au service correspondant
      }
      return map;
    }, {});

    for (const [serviceId, service] of Object.entries(serviceMap)) {
      for (const date of dates) {
        for (const horaire of horaires) {
          await pool.query(
            `
            INSERT INTO disponibilite (service_id, date, horaire, nombre_disponible)
            VALUES ($1, $2, $3, $4);
          `,
            [
              serviceId,
              date.toISOString().split("T")[0],
              horaire,
              service.nombre_disponible,
            ]
          );
        }
      }
    }
    console.log("Disponibilités initialisées.");
  } catch (err) {
    console.error("Erreur lors de l'initialisation:", err.message);
  }
})();

module.exports = pool;
