const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db");

// Middleware d'authentification JWT
const authMiddleware = require("./auth/middleware");

// Initialisation de l'application
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middlewares globaux
app.use(bodyParser.json());
app.use(cookieParser());

const corsOptions = {
  origin: "http://localhost:3000", // FRONTEND
  credentials: true, // Permet l'envoi des cookies (ou autres informations d'authentification)
  methods: ["GET", "POST", "PUT", "DELETE"], // Méthodes HTTP autorisées
};

app.use(cors(corsOptions)); // Applique la configuration CORS avec les options définies

// Routes de  pour les utilisateur
const Getinfo = require("./user/Getinfo.js");

// Routes de  pour les Avis
const GetServices = require("./Admin/GetServices.js");
// Routes de  pour les Avis
const PutAvis = require("./Avis/PutAvis.js");
// Routes de  pour les Avis
const DeletAvis = require("./Admin/DeletAvis.js");

// Routes de gestion pour l'UseManagement
const GetUsers = require("./Admin/GetUsers");
const DeletUser = require("./Admin/DeletUser.js");

// Routes de gestion pour Contact
const PostContact = require("./Contact/PostContact.js");
// Routes de gestion pour ContactManagement
const GetContact = require("./Admin/GetContact.js");

// Routes de gestion pour l'authentification
const inscriptionRoute = require("./auth/inscription");
const connexionRoute = require("./auth/connexion");
const deconnexionRoute = require("./auth/deconnexion");

const motDePasseOublieRoute = require("./auth/motdepasse_oublie");
const reinitialisationRoute = require("./auth/reinitialisation");

const refreshtokenRoute = require("./auth/refresh_token");
const rememberMeRoute = require("./auth/rememberme");

// Sign In Google
const google_authRouter = require("./services/google/oauth");
const google_requestRouter = require("./services/google/request");

// Routes de gestion pour la réservation
const reservationRoutes = require("./reservation/index");

// Routes de  pour les Avis
const UpdateUser = require("./user/UpdateUser.js");

// Routes pour l'authentification
app.use("/api/signup", inscriptionRoute);
app.use("/api/signin", connexionRoute);
app.use("/api/logout", authMiddleware, deconnexionRoute);

app.use("/api/forgot_mdp", motDePasseOublieRoute);
app.use("/api/reset_mdp", reinitialisationRoute);

app.use("/api/remember-me", rememberMeRoute);
app.use("/api/refresh-token", refreshtokenRoute);

// Routes pour l'authentification avec Google
app.use("/google/oauth", google_authRouter);
app.use("/google/request", google_requestRouter);

// Routes pour les réservations
app.use("/api/reservation", reservationRoutes);

// Routes pour l'UseManagement
app.use("/api/users", GetUsers);
app.use("/api/delete_user", DeletUser);

// Routes pour Contact
app.use("/api/contact", PostContact);
// Routes pour ContactManagement
app.use("/api/contacts", GetContact);
// Routes pour Avis
app.use("/api/avis", PutAvis);
// Routes pour DeleteAvis
app.use("/api/avis/delete", DeletAvis);

// Routes pour GetREv
app.use("/api/services", GetServices);

// Routes pour UpadteUser
app.use("/api/update-user", UpdateUser);

app.use("/api/userss", Getinfo);
// Lancement du serveur
app.listen(port, () => {
  console.log(`Serveur lancé sur le port ${port}`);
});
