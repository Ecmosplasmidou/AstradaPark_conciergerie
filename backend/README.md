# KELVAL SARL — Backend API

API REST pour la plateforme de conciergerie automobile **KELVAL SARL**, construite avec [NestJS](https://nestjs.com/) et [MongoDB](https://www.mongodb.com/).

## Stack technique

- **Framework** : NestJS (Node.js / TypeScript)
- **Base de données** : MongoDB via Mongoose
- **Authentification** : JWT (JSON Web Tokens) avec Passport
- **Planification** : `@nestjs/schedule` pour les tâches CRON

## Fonctionnalités

### Authentification (`/auth`)
- `POST /auth/signup` — Inscription d'un nouveau client avec sa flotte de véhicules
- `POST /auth/login` — Connexion et génération du token JWT
- `PATCH /auth/profile` — Mise à jour du profil utilisateur (véhicules, infos)
- `GET /auth/users` — Liste de tous les utilisateurs (admin)

### Gestion du Parking (`/parking`)
- `POST /parking/seed` — Initialisation des 30 places de stationnement
- `GET /parking` — Liste de toutes les places (statut, occupant, véhicule)
- `PATCH /parking/:number` — Attribution ou libération d'une place

### Facturation (`/invoices`)
- `GET /invoices` — Toutes les factures (admin)
- `GET /invoices/my` — Factures de l'utilisateur connecté
- **CRON automatique** : Génération des factures mensuelles (240€ TTC/place) chaque 1er du mois
- **Prorata automatique** : Facture calculée au prorata lors de l'attribution d'une place en cours de mois

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` à la racine du backend :

```env
MONGODB_URI=mongodb://localhost:27017/conciergerie
JWT_SECRET=votre_secret_jwt
```

## Lancement

```bash
# Développement (hot-reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Structure du projet

```
src/
├── auth/                  # Module authentification
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── schemas/
│       └── user.schema.ts
├── parking/               # Module parking & facturation
│   ├── parking.controller.ts
│   ├── parking.service.ts
│   ├── parking.module.ts
│   ├── invoice.controller.ts
│   ├── invoice.service.ts
│   └── schemas/
│       ├── parking.schema.ts
│       └── invoice.schema.ts
└── app.module.ts
```

## Tarification

| Type | Montant |
|------|---------|
| Abonnement mensuel | 240,00 € TTC / place |
| Prorata (attribution en cours de mois) | Calculé automatiquement |

---

**KELVAL SARL** — Conciergerie Automobile de Prestige
7 bis, rue du Pont St Pierre, 31300 TOULOUSE
SIRET : 438 527 640 00017
