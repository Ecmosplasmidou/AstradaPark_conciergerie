# KELVAL SARL — Frontend

Interface client et administration pour la plateforme de conciergerie automobile **KELVAL SARL**, construite avec [React](https://react.dev/) et [Vite](https://vitejs.dev/).

## Stack technique

- **Framework** : React 18 + TypeScript
- **Bundler** : Vite
- **Styling** : Tailwind CSS
- **Routing** : React Router v6
- **HTTP** : Axios
- **PDF** : jsPDF (génération de factures côté client)
- **Icônes** : Lucide React

## Design

Interface premium inspirée de l'univers de la conciergerie automobile de luxe :

- **Palette** : Noir (`#0A0A0A`), Or Champagne (`#D4A853`), Émeraude
- **Typographie** : Playfair Display (titres) + Inter (corps)
- **Effets** : Glassmorphisme, animations shimmer, micro-interactions
- **Responsive** : Adaptatif mobile → desktop avec bottom sheet mobile pour l'admin

## Pages

### 🔐 Authentification
- **Login** (`/login`) — Connexion membre
- **Register** (`/register`) — Inscription avec enregistrement de la flotte véhicules

### 👤 Espace Client (`/user`)
- Visualisation des places de stationnement attribuées
- Historique des factures avec téléchargement PDF
- Gestion du profil et de la flotte automobile

### 🛡️ Administration (`/admin`)
- Vue d'ensemble des 30 places (disponibles / occupées)
- Attribution de places aux clients (recherche → sélection véhicule → validation)
- Révocation d'accès avec confirmation modale
- Consultation et téléchargement de toutes les factures
- Bottom sheet mobile pour l'attribution sur petit écran

## Factures PDF

Les factures sont générées côté client avec **jsPDF** et contiennent :
- En-tête KELVAL SARL avec SIRET, TVA, adresse, téléphone
- Informations du client
- Détail de la prestation (place, période, véhicule)
- Montant TTC avec mentions légales

## Installation

```bash
npm install
```

## Lancement

```bash
# Développement (hot-reload)
npm run dev

# Build production
npm run build
```

## Structure du projet

```
src/
├── components/
│   └── Header.tsx          # Navigation responsive avec menu burger
├── pages/
│   ├── Login.tsx           # Page de connexion
│   ├── Register.tsx        # Page d'inscription
│   ├── UserDashboard.tsx   # Tableau de bord client
│   └── AdminDashboard.tsx  # Tableau de bord administrateur
├── utils/
│   └── generateInvoicePDF.ts  # Générateur de factures PDF
├── services/
│   └── api.ts              # Instance Axios configurée
├── App.tsx                 # Routes principales
├── main.tsx                # Point d'entrée
└── index.css               # Design system (thème luxe)
```

## Variables d'environnement

L'API backend est configurée sur `http://localhost:3000` par défaut.

---

**KELVAL SARL** — Conciergerie Automobile de Prestige
7 bis, rue du Pont St Pierre, 31300 TOULOUSE
SIRET : 438 527 640 00017
