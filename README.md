<![CDATA[<div align="center">

# 🌾 AgriConnect — Marketplace Agricole

**Plateforme e-commerce agricole cloud-native construite avec une architecture microservices**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Jenkins](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939?logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

*Connecter les agriculteurs tunisiens directement aux acheteurs via une marketplace digitale moderne et scalable*

</div>

---

## 📋 Table des Matières

- [Présentation](#-présentation)
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Architecture](#-architecture)
- [Communication Inter-Services](#-communication-inter-services)
- [Stack Technique](#-stack-technique)
- [Microservices — Description Détaillée](#-microservices--description-détaillée)
- [Frontend — Détail des Modules](#-frontend--détail-des-modules)
- [Prérequis](#-prérequis)
- [Installation et Démarrage](#-installation-et-démarrage)
- [Variables d'Environnement](#-variables-denvironnement)
- [Base de Données](#-base-de-données)
- [Déploiement](#-déploiement)
- [Monitoring et Observabilité](#-monitoring-et-observabilité)
- [Pipeline CI/CD](#-pipeline-cicd)
- [Sécurité](#-sécurité)
- [Référence API](#-référence-api)
- [Structure du Projet](#-structure-du-projet)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

---

## 🌍 Présentation

**AgriConnect** est une plateforme e-commerce agricole full-stack conçue pour le marché tunisien. Elle met en relation directe les agriculteurs (Farmers) et les acheteurs (Customers) sans intermédiaire. La plateforme offre un écosystème complet : catalogue de produits agricoles, gestion de commandes avec suivi en temps réel, paiement sécurisé via **Konnect** (passerelle de paiement tunisienne) et Stripe, messagerie instantanée entre acheteurs et vendeurs, gestion de la logistique et livraison avec suivi GPS, et publication d'offres d'emploi agricole.

### Points Clés

| Caractéristique | Description |
|---|---|
| 🏗️ **Architecture Microservices** | 8 services métier indépendants + API Gateway + Stats Aggregator |
| 🖥️ **Frontend SPA Moderne** | Angular 17 standalone avec lazy-loading, Tailwind CSS, interface en français |
| 🔐 **Authentification Multi-Modes** | JWT + Google OAuth 2.0 + récupération de mot de passe par email |
| 💳 **Paiement Multi-Passerelle** | Konnect (Tunisie — wallet, carte bancaire, e-DINAR) + Stripe |
| 💬 **Messagerie en Temps Réel** | WebSocket STOMP + SockJS pour le chat acheteur ↔ vendeur |
| 🗺️ **Suivi GPS en Temps Réel** | Tracking du livreur avec Leaflet + geolocalisation |
| 🐳 **Entièrement Conteneurisé** | Docker multi-stage builds, images non-root (UID 1000) |
| ☸️ **Prêt Kubernetes** | Kustomize overlays pour environnements dev et production |
| 📊 **Observabilité Intégrée** | Prometheus + Grafana + Spring Boot Actuator + OpenTelemetry tracing |
| 🔒 **Sécurité Multi-Couches** | SAST (SpotBugs), SCA (OWASP), container scanning (Trivy), Network Policies |
| 🚀 **CI/CD Production-Grade** | Jenkins pipeline avec builds parallèles, security gates, promotion manuelle |

---

## ✨ Fonctionnalités Principales

### Pour les Acheteurs (Customers)
- 🛒 Parcourir et rechercher des produits agricoles par catégorie, mot-clé ou agriculteur
- 📦 Commander avec suivi complet du statut (PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED)
- 🗺️ Tracking en temps réel de la position du livreur sur une carte interactive
- 💳 Paiement sécurisé via Konnect (carte bancaire, e-DINAR, wallet) ou paiement à la livraison
- 💬 Chat en temps réel avec les agriculteurs
- ⭐ Évaluation et notation des commandes livrées
- 📋 Consulter et postuler aux offres d'emploi agricole
- 🚛 Postuler aux offres de logistique/livraison

### Pour les Agriculteurs (Farmers)
- 🌿 Publier et gérer un catalogue de produits avec images, catégories et prix
- 📊 Tableau de bord analytique (ventes, commandes, revenus)
- 📦 Gérer les commandes entrantes (confirmer, préparer, marquer comme expédié)
- 💬 Répondre aux messages des acheteurs
- 👷 Publier des offres d'emploi agricole et gérer les candidatures
- 🚛 Créer des offres de logistique et gérer les candidatures de livreurs
- 📍 Définir la localisation de la ferme sur une carte

---

## 🏛️ Architecture

```
                           ┌─────────────────┐
                           │    Frontend     │
                           │  (Angular 17)   │
                           │   Port: 4200    │
                           └────────┬────────┘
                                    │ Nginx reverse proxy
                           ┌────────▼────────┐
                           │   API Gateway   │
                           │ (Spring Cloud)  │
                           │   Port: 8080    │
                           └────────┬────────┘
                                    │
       ┌────────┬────────┬──────────┼──────────┬────────┬────────┬────────┐
       │        │        │          │          │        │        │        │
  ┌────▼───┐┌───▼───┐┌───▼────┐┌───▼────┐┌────▼───┐┌───▼───┐┌──▼────┐┌──▼───┐
  │  Auth  ││ User  ││Catalog ││ Order  ││Payment ││Messag.││Deliv. ││ Jobs │
  │ :8087  ││ :8088 ││ :8080  ││ :8080  ││ :8080  ││ :8080 ││ :8086 ││:8080 │
  └────┬───┘└───┬───┘└───┬────┘└───┬────┘└────┬───┘└───┬───┘└──┬────┘└──┬───┘
       │        │        │         │     ┌────┘        │       │        │
       │        │        │         │     │ HTTP calls  │       │        │
       │        │        │         │◄────┘ (sync)      │       │        │
       │        │        │         │          ┌────────►│       │        │
       │        │        │         │          │ HTTP    │       │        │
       └────────┴────────┴─────────┼──────────┴────────┴───────┴────────┘
                                   │
                           ┌───────▼───────┐
                           │   MongoDB     │
                           │  (Mongo 7.0)  │
                           │  Port: 27017  │
                           │               │
                           │  Databases:   │
                           │  ├─ authdb    │
                           │  ├─ userdb    │
                           │  ├─ orderdb   │
                           │  ├─ paymentdb │
                           │  ├─ msgdb     │
                           │  ├─ deliverydb│
                           │  └─ jobsdb    │
                           └───────────────┘

  ┌──────────────────────────────────────────────────────────────────────────┐
  │                        Monitoring Stack                                 │
  │                                                                        │
  │   ┌──────────────┐   scrapes /actuator/prometheus          ┌─────────┐ │
  │   │  Prometheus  │◄── from all 9 services ────────────────►│ Grafana │ │
  │   │   :9090      │         datasource                      │  :3000  │ │
  │   └──────────────┘                                         └─────────┘ │
  └──────────────────────────────────────────────────────────────────────────┘
```

### Flux Principal des Requêtes

1. Le **Frontend** Angular envoie toutes les requêtes API via Nginx reverse proxy vers l'**API Gateway**
2. L'**API Gateway** (Spring Cloud Gateway) route chaque requête vers le microservice approprié selon le path (`/api/auth/**`, `/api/products/**`, etc.)
3. Chaque **microservice** valide le JWT indépendamment, exécute la logique métier, et persiste dans sa propre base MongoDB
4. Les **WebSocket** (chat en temps réel) passent par `/ws/**` via le Gateway vers le messaging-service

---

## 🔗 Communication Inter-Services

Bien que les services soient pour la plupart indépendants et communiquent via l'API Gateway, il existe des **communications directes HTTP entre services** pour certaines opérations critiques :

```
┌──────────────┐   POST /api/payments/order-created     ┌──────────────────┐
│ Order Service│ ────────────────────────────────────────►│ Payment Service  │
│              │   (notification de commande créée)      │                  │
└──────────────┘                                         └────────┬─────────┘
       ▲                                                          │
       │  PUT /api/orders/{id}/status                             │
       │  (mise à jour statut + paiement)                         │
       └──────────────────────────────────────────────────────────┘
                                                                  │
                   POST /api/delivery/payment-confirmed           │
┌──────────────┐◄─────────────────────────────────────────────────┘
│  Delivery    │   (notification paiement confirmé →
│  Service     │    génération auto. route logistique)
└──────────────┘

┌──────────────┐   GET /api/users/by-role, /api/products/public/all,
│  API Gateway │   GET /api/orders/farmer/{id}
│ (StatsCtrl)  │────── agrège les données pour /api/stats/global ──────►
└──────────────┘
```

| Source | Destination | Endpoint | But |
|---|---|---|---|
| Order Service | Payment Service | `POST /api/payments/order-created` | Notifier qu'une commande a été créée |
| Payment Service | Order Service | `PUT /api/orders/{id}/status` | Mettre à jour le statut de paiement |
| Payment Service | Delivery Service | `POST /api/delivery/payment-confirmed` | Déclencher la création d'une route de livraison |
| API Gateway (Stats) | User + Catalog + Order | `GET` divers | Agréger les statistiques globales de la plateforme |

---

## 🛠️ Stack Technique

### Backend

| Technologie | Version | Rôle |
|---|---|---|
| **Java** | 17 (Eclipse Temurin) | Langage d'exécution |
| **Spring Boot** | 3.2.0 | Framework microservices |
| **Spring Cloud Gateway** | 2023.0.0 | Routage API, CORS, WebSocket proxy |
| **Spring Security** | 6.x | Authentification & autorisation |
| **Spring Data MongoDB** | 3.2.x | Couche de persistance |
| **Spring Boot Actuator** | 3.2.x | Health checks, métriques, info |
| **Spring WebSocket (STOMP)** | 3.2.x | Messagerie temps réel |
| **JWT (jjwt)** | 0.12.3 | Authentification par tokens |
| **Micrometer + Prometheus** | — | Métriques d'application |
| **OpenTelemetry** | — | Tracing distribué |
| **Lombok** | 1.18.30 | Réduction du boilerplate |
| **Maven** | 3.9.5 | Build et gestion de dépendances |
| **Jakarta Validation** | — | Validation des DTOs |

### Frontend

| Technologie | Version | Rôle |
|---|---|---|
| **Angular** | 17 | Framework SPA (standalone components) |
| **TypeScript** | 5.2 | JavaScript typé |
| **Tailwind CSS** | 3.4 + plugins `forms` & `typography` | Styling utilitaire |
| **Leaflet** | 1.9.4 | Cartes interactives (localisation fermes, tracking livraison) |
| **Chart.js** | 4.5 | Graphiques et analytiques du tableau de bord |
| **STOMP.js** | 7.3 | Client WebSocket STOMP (messagerie) |
| **SockJS** | 1.6 | Fallback WebSocket pour navigateurs incompatibles |
| **RxJS** | 7.8 | Programmation réactive |
| **Framer Motion** | 12.35 | Animations et micro-interactions |
| **Karma + Jasmine** | 6.4 / 5.1 | Tests unitaires frontend |
| **PostCSS + Autoprefixer** | 8.5 / 10.4 | Post-traitement CSS |

### Infrastructure & DevOps

| Technologie | Rôle |
|---|---|
| **Docker** | Conteneurisation (builds multi-stage) |
| **Docker Compose** | Orchestration locale (12 conteneurs) |
| **Kubernetes + Kustomize** | Orchestration production (overlays dev/prod) |
| **Jenkins** | Pipeline CI/CD (Jenkinsfile déclaratif) |
| **Prometheus** (v2.54.1) | Collecte de métriques |
| **Grafana** (v11.2.0) | Visualisation des métriques |
| **Nginx** (Alpine) | Reverse proxy frontend + cache control |
| **Trivy** | Scan de vulnérabilités des images Docker |
| **SpotBugs + FindSecBugs** (v4.8.2 / v1.12.0) | Analyse statique SAST |
| **OWASP Dependency-Check** (v9.0.7) | Analyse de composition logicielle SCA |
| **SonarQube** (optionnel) | Qualité de code |
| **JaCoCo** (v0.8.11) | Couverture de tests |
| **Checkstyle** (v3.3.1) | Style Google Java |
| **PMD** (v3.21.0) | Analyse de code |

---

## 🔧 Microservices — Description Détaillée

### 1. API Gateway (`gateway/api-gateway`) — Port 8080

L'API Gateway est le point d'entrée unique de toute la plateforme. Construit avec **Spring Cloud Gateway** (réactif / Netty), il :

- **Route les requêtes** vers les microservices via des predicates de path
- **Gère le CORS** : autorise `http://localhost:4200` avec GET, POST, PUT, DELETE, OPTIONS
- **Proxy les WebSocket** : route `/ws/**` vers le messaging-service
- **Agrège les statistiques** : le `StatsController` agrège dynamiquement les données de User, Catalog et Order services via `WebClient` réactif
- **Expose les métriques** Actuator pour Prometheus

**Routes configurées :**

| Predicate | Service Destination |
|---|---|
| `/api/auth/**` | auth-service:8087 |
| `/api/products/**` | catalog-service:8080 |
| `/api/orders/**` | order-service:8080 |
| `/api/payments/**` | payment-service:8080 |
| `/api/messages/**` | messaging-service:8080 |
| `/ws/**` | messaging-service:8080 |
| `/api/delivery/**` | delivery-service:8086 |
| `/api/jobs/**` | jobs-service:8080 |
| `/api/users/**` | user-service:8088 |
| `/api/stats/**` | *local* (StatsController dans le Gateway) |

---

### 2. Auth Service (`services/auth-service`) — Port 8087

Service d'authentification gérant l'inscription, la connexion et la gestion des tokens JWT.

**Endpoints :**

| Méthode | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Connexion (email + mot de passe) → retourne JWT |
| `POST` | `/api/auth/signup` | Inscription (email, mot de passe, nom, prénom, rôle, téléphone) |
| `POST` | `/api/auth/google` | Connexion via Google OAuth 2.0 (token Google + rôle) |
| `POST` | `/api/auth/forgot-password` | Envoi d'un code de réinitialisation par email (SMTP) |
| `POST` | `/api/auth/verify-reset-code` | Vérification du code de réinitialisation |
| `POST` | `/api/auth/reset-password` | Réinitialisation du mot de passe avec code |

**Fonctionnalités :**
- Hachage des mots de passe avec Spring Security
- Génération de JWT avec 24h d'expiration (configurable)
- Support Google OAuth 2.0
- Envoi d'emails via SMTP (Gmail) pour la récupération de mot de passe
- Validation des entrées avec Jakarta Validation

---

### 3. User Service (`services/user-service`) — Port 8088

Gestion des profils utilisateurs, y compris les profils agriculteurs enrichis.

**Endpoints :**

| Méthode | Path | Description |
|---|---|---|
| `GET` | `/api/users/me` | Profil de l'utilisateur connecté |
| `PUT` | `/api/users/profile` | Mise à jour du profil (nom, adresse, photo, profil ferme) |
| `PUT` | `/api/users/change-password` | Changement de mot de passe |
| `GET` | `/api/users/{userId}` | Profil d'un utilisateur par ID |
| `GET` | `/api/users/by-role?role=FARMER` | Lister tous les utilisateurs par rôle |

**Modèle Utilisateur :**
- Rôles : `FARMER`, `CUSTOMER`, `ADMIN`
- Adresse avec coordonnées GPS (latitude/longitude)
- Profil agriculteur enrichi : nom de ferme, description, certifications, spécialités, taille, notation, image, position GPS

---

### 4. Catalog Service (`services/catalog-service`) — Port 8080

Gestion du catalogue de produits agricoles.

**Endpoints :**

| Méthode | Path | Description |
|---|---|---|
| `GET` | `/api/products/public/all` | Tous les produits (public) |
| `GET` | `/api/products/public/{id}` | Détail d'un produit (public) |
| `GET` | `/api/products/public/category/{category}` | Produits par catégorie |
| `GET` | `/api/products/public/farmer/{farmerId}` | Produits d'un agriculteur |
| `GET` | `/api/products/public/search?keyword=...` | Recherche par mot-clé |
| `POST` | `/api/products` | Créer un produit (authentifié) |
| `PUT` | `/api/products/{id}` | Modifier un produit |
| `DELETE` | `/api/products/{id}` | Supprimer un produit |

> **Note :** Les routes publiques utilisent le préfixe `/public/` et ne nécessitent pas d'authentification.

---

### 5. Order Service (`services/order-service`) — Port 8080

Gestion complète du cycle de vie des commandes avec suivi en temps réel.

**Endpoints :**

| Méthode | Path | Description |
|---|---|---|
| `POST` | `/api/orders` | Créer une commande |
| `GET` | `/api/orders` | Mes commandes (acheteur) |
| `GET` | `/api/orders/{id}` | Détail d'une commande |
| `PUT` | `/api/orders/{id}/status` | Mettre à jour le statut |
| `DELETE` | `/api/orders/{id}` | Annuler une commande |
| `GET` | `/api/orders/farmer/my-orders` | Commandes reçues (agriculteur) |
| `GET` | `/api/orders/farmer/{farmerId}` | Commandes d'un agriculteur |
| `PUT` | `/api/orders/{id}/driver-location` | MAJ position GPS du livreur |
| `PUT` | `/api/orders/{id}/confirm-receipt` | Confirmation de réception |
| `PUT` | `/api/orders/{id}/rate` | Évaluation de la commande |
| `PUT` | `/api/orders/{id}/departure` | Définir le départ (date, lieu, transporteur) |

**Statuts de commande :** `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `PROCESSING` → `SHIPPED` → `DELIVERED` | `CANCELLED` | `REFUNDED`

**Statuts de paiement :** `PENDING` → `PAID` | `FAILED` | `REFUNDED`

---

### 6. Payment Service (`services/payment-service`) — Port 8080

Gestion des paiements avec intégration **Konnect** (passerelle tunisienne) et support Stripe.

**Endpoints :**

| Méthode | Path | Description |
|---|---|---|
| `GET` | `/api/payments/methods` | Liste des méthodes de paiement de l'utilisateur |
| `POST` | `/api/payments/methods` | Ajouter une méthode de paiement |
| `PUT` | `/api/payments/methods/{id}/set-default` | Définir méthode par défaut |
| `DELETE` | `/api/payments/methods/{id}` | Supprimer méthode (soft delete) |
| `POST` | `/api/payments/create-intent` | Créer un payment intent (Stripe) |
| `GET` | `/api/payments/config` | Config Stripe (clé publique) |
| `POST` | `/api/payments/order-created` | Réception notification commande (inter-service) |
| `POST` | `/api/payments/konnect/initiate/{orderId}` | Initier paiement Konnect |
| `GET` | `/api/payments/konnect/verify?ref=...&orderId=...` | Vérifier paiement Konnect |

**Flux de paiement Konnect :**
1. Le frontend appelle `POST /api/payments/konnect/initiate/{orderId}`
2. Le service crée un paiement via l'API Konnect (montant en millimes TND)
3. Le service retourne `payUrl` + `paymentRef`
4. Le frontend redirige l'utilisateur vers `payUrl` (page de paiement Konnect)
5. Après paiement, l'utilisateur est redirigé vers `/payment/result?orderId=...`
6. Le frontend appelle `GET /api/payments/konnect/verify` pour confirmer
7. Si succès : mise à jour du statut de commande via Order Service + notification Delivery Service

**Méthodes de paiement Konnect supportées :** `wallet`, `bank_card`, `e-DINAR`

---

### 7. Messaging Service (`services/messaging-service`) — Port 8080

Messagerie en temps réel entre acheteurs et vendeurs via WebSocket STOMP.

**Endpoints REST :**

| Méthode | Path | Description |
|---|---|---|
| `GET` | `/api/messages/conversations` | Toutes les conversations de l'utilisateur |
| `GET` | `/api/messages/conversations/{id}` | Détail d'une conversation |
| `POST` | `/api/messages/conversations` | Créer/récupérer une conversation |
| `POST` | `/api/messages/send` | Envoyer un message |
| `PUT` | `/api/messages/conversations/{id}/read` | Marquer comme lu |
| `GET` | `/api/messages/unread-count` | Compteur de messages non lus |

**Configuration WebSocket :**
- Endpoint STOMP : `/ws` (avec fallback SockJS)
- Broker de messages : `/topic/**` (in-memory simple broker)
- Préfixe d'envoi : `/app/**`
- CORS autorisé : `http://localhost:4200`

---

### 8. Delivery Service (`services/delivery-service`) — Port 8086

Gestion de la logistique, des tournées de livraison et du suivi GPS en temps réel.

**Endpoints :**

| Méthode | Path | Description |
|---|---|---|
| `GET` | `/api/delivery/routes` | Toutes les routes de livraison |
| `GET` | `/api/delivery/routes/{id}` | Détail d'une route |
| `GET` | `/api/delivery/routes/status/{status}` | Routes par statut |
| `POST` | `/api/delivery/routes` | Créer une offre de logistique (fermier) |
| `PUT` | `/api/delivery/routes/{id}` | Mettre à jour une route |
| `DELETE` | `/api/delivery/routes/{id}` | Supprimer une route |
| `POST` | `/api/delivery/routes/{id}/start` | Démarrer une tournée |
| `POST` | `/api/delivery/routes/{id}/complete` | Terminer une tournée |
| `PUT` | `/api/delivery/routes/{routeId}/stops/{stopIndex}` | MAJ statut d'un arrêt |
| `GET` | `/api/delivery/my-routes` | Mes routes (livreur) |
| `PUT` | `/api/delivery/routes/{id}/driver-location` | MAJ GPS livreur |
| `POST` | `/api/delivery/routes/{id}/apply` | Postuler comme livreur |
| `GET` | `/api/delivery/applications/my` | Mes candidatures logistique |
| `PUT` | `/api/delivery/routes/{routeId}/applications/{appIndex}` | Gérer candidature |
| `GET` | `/api/delivery/farmer-offers` | Mes offres logistique (fermier) |
| `POST` | `/api/delivery/payment-confirmed` | Notification paiement (inter-service) |

**Statuts de route :** `PLANNED` → `IN_PROGRESS` → `COMPLETED`

**Statuts de candidature :** `PENDING` → `ACCEPTED` | `REJECTED`

---

### 9. Jobs Service (`services/jobs-service`) — Port 8080

Publication et gestion d'offres d'emploi agricole.

**Endpoints :**

| Méthode | Path | Description |
|---|---|---|
| `GET` | `/api/jobs` | Toutes les offres actives (public) |
| `GET` | `/api/jobs/{id}` | Détail d'une offre |
| `GET` | `/api/jobs/my-offers` | Mes offres (agriculteur) |
| `POST` | `/api/jobs` | Créer une offre d'emploi |
| `PUT` | `/api/jobs/{id}` | Modifier une offre |
| `DELETE` | `/api/jobs/{id}` | Supprimer une offre |
| `POST` | `/api/jobs/{id}/apply` | Postuler à une offre |
| `PUT` | `/api/jobs/{jobId}/applications/{applicationIndex}` | Gérer une candidature |

**Modèle d'offre :** Titre, description, type de poste, type de contrat, localisation, salaire min/max, prérequis, avantages, nombre de postes, date limite de candidature.

---

## 🖥️ Frontend — Détail des Modules

Le frontend Angular 17 utilise des **standalone components** avec lazy-loading. L'interface est en **français** et cible le marché tunisien.

### Modules de l'Application

| Module | Route | Accès | Description |
|---|---|---|---|
| **Home** | `/` | Public | Page d'accueil avec statistiques dynamiques (via `/api/stats/global`), avantages acheteurs/vendeurs |
| **Marketplace** | `/marketplace` | Public | Parcourir, filtrer et rechercher des produits agricoles |
| **Product Detail** | `/product/:id` | Public | Vue détaillée d'un produit avec infos vendeur |
| **Cart** | `/cart` | Public | Panier d'achat et processus de checkout |
| **Auth** | `/auth` | Public | Connexion, inscription, mot de passe oublié |
| **Farmer Dashboard** | `/farmer-dashboard` | 🔒 FARMER | Gestion produits, commandes entrantes, analytics |
| **Buyer Dashboard** | `/buyer-dashboard` | 🔒 CUSTOMER | Historique d'achats, favoris |
| **Orders** | `/orders` | 🔒 Auth | Gestion des commandes |
| **My Orders** | `/my-orders` | 🔒 CUSTOMER | Suivi de commandes avec tracking GPS |
| **Messages** | `/messages` | 🔒 Auth | Chat temps réel acheteur ↔ vendeur |
| **Payment Settings** | `/payment-settings` | 🔒 Auth | Configuration des méthodes de paiement |
| **Payment Result** | `/payment/result` | Public | Page de résultat après paiement Konnect |
| **Logistics** | `/logistics` | 🔒 Auth | Gestion des routes de livraison (fermier) |
| **Jobs** | `/jobs` | Public | Liste des offres d'emploi agricole |
| **Offres Emploi** | `/offres-emploi` | Public | Offres d'emploi côté acheteur |
| **Offres Logistique** | `/offres-logistique` | Public | Offres de logistique côté acheteur |
| **Profile** | `/profile` | 🔒 Auth | Gestion du profil utilisateur |

### Composants Partagés (`shared/`)

| Composant | Description |
|---|---|
| **Navbar** | Barre de navigation responsive avec menu utilisateur et compteur de messages non lus |
| **Product Card** | Carte produit réutilisable avec image, prix, catégorie |
| **Map Picker** | Composant de sélection de localisation sur carte (Leaflet) |
| **Map View** | Composant d'affichage de carte (suivi livraison) |
| **Image Upload** | Upload d'images pour produits et profils |
| **Skeleton Loader** | Placeholder de chargement (skeleton screens) |
| **Pagination** | Composant de pagination réutilisable |
| **Toast** | Notifications toast (succès, erreur, info) |

### Services (`core/services/`)

| Service | Rôle |
|---|---|
| `AuthService` | Authentification, JWT, Google OAuth, gestion session localStorage |
| `ProductService` | CRUD produits, recherche, filtres |
| `OrderService` | Création et suivi de commandes |
| `CartService` | Gestion du panier (local) |
| `PaymentService` | Intégration Konnect et Stripe |
| `MessageService` | Conversations et envoi de messages |
| `WebSocketService` | Connexion STOMP/SockJS pour chat temps réel |
| `DeliveryService` | Routes de livraison et candidatures logistique |
| `JobService` | Offres d'emploi et candidatures |
| `FarmerService` | Données spécifiques au dashboard fermier |
| `StatsService` | Statistiques globales de la plateforme |
| `GeolocationService` | API de géolocalisation du navigateur |
| `ToastService` | Notifications utilisateur |

### Guards et Interceptors

| Élément | Rôle |
|---|---|
| `AuthGuard` | Protège les routes authentifiées, vérifie le rôle (FARMER/CUSTOMER) |
| `JwtInterceptor` | Injecte automatiquement le token JWT dans le header `Authorization` |

---

## ✅ Prérequis

| Outil | Version Requise | Téléchargement |
|---|---|---|
| **Java JDK** | 17+ | [Eclipse Temurin](https://adoptium.net/) |
| **Maven** | 3.9+ | [Apache Maven](https://maven.apache.org/download.cgi) |
| **Node.js** | 20+ | [Node.js](https://nodejs.org/) |
| **npm** | 9+ | Inclus avec Node.js |
| **Docker** | 24+ | [Docker Desktop](https://docs.docker.com/get-docker/) |
| **Docker Compose** | v2 (plugin) | Inclus avec Docker Desktop |
| **Git** | 2.x | [Git](https://git-scm.com/) |

---

## 🚀 Installation et Démarrage

### 1. Cloner le dépôt

```bash
git clone https://github.com/your-org/agri-marketplace.git
cd agri-marketplace
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditez .env avec vos valeurs réelles :
# - MongoDB URI
# - JWT secret (générer avec : openssl rand -hex 32)
# - SMTP credentials pour l'envoi d'emails
# - Clé API Konnect
```

### 3. Démarrage Rapide — Docker Compose (Recommandé)

La manière la plus rapide de démarrer tout le stack (12 conteneurs) :

```bash
# Construire et démarrer tous les services
docker compose up --build -d

# Vérifier que tous les conteneurs sont up
docker compose ps

# Suivre les logs
docker compose logs -f
```

Cela démarre :
- 8 microservices métier + API Gateway
- Frontend Angular (Nginx)
- MongoDB 7.0
- Prometheus + Grafana

### 4. Démarrage via Script Helper

Pour un workflow complet build-from-source :

```bash
chmod +x run-project.sh
./run-project.sh
```

Ce script :
1. Corrige les permissions des fichiers de build (sudo)
2. Compile tous les services backend avec Maven (`mvn clean package -DskipTests`)
3. Compile le frontend (`npm ci && npm run build`)
4. Démarre le stack Docker Compose complet

### 5. Accéder à l'Application

| Service | URL | Identifiants |
|---|---|---|
| 🖥️ **Frontend** | [http://localhost:4200](http://localhost:4200) | — |
| 🔌 **API Gateway** | [http://localhost:8080](http://localhost:8080) | — |
| 📊 **Prometheus** | [http://localhost:9090](http://localhost:9090) | — |
| 📈 **Grafana** | [http://localhost:3000](http://localhost:3000) | `admin` / `admin` |

### 6. Développement Local Avancé

Avec un registre Docker local pour simuler un environnement CI :

```bash
chmod +x scripts/run-locally.sh
./scripts/run-locally.sh

# Ou pour sauter le build si les images existent déjà :
./scripts/run-locally.sh --skip-build
```

### 7. Script Run-All (Pipeline Complet)

```bash
chmod +x scripts/run-all.sh
./scripts/run-all.sh             # Build complet + push + compose
./scripts/run-all.sh --quick     # Skip les builds, juste démarrer compose
./scripts/run-all.sh --no-push   # Build les images sans pousser au registre
```

### 8. Frontend en mode développement (Hot Reload)

```bash
cd frontend
npm install
npm start
# Ouvre http://localhost:4201 (port dev) avec proxy vers l'API Gateway
```

---

## ⚙️ Variables d'Environnement

Copier `.env.example` vers `.env` et configurer :

| Variable | Description | Défaut |
|---|---|---|
| `SPRING_DATA_MONGODB_URI` | URI de connexion MongoDB (auth-service, user-service) | `mongodb://mongo:27017/agri_market` |
| `MONGO_URI` | URI MongoDB (catalog, order, payment, messaging, jobs, delivery) | `mongodb://mongo:27017/agri_market` |
| `JWT_SECRET` | Clé secrète JWT (hex 256-bit, 64 caractères) | *(générer avec `openssl rand -hex 32`)* |
| `MAIL_HOST` | Serveur SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Port SMTP | `587` |
| `MAIL_USERNAME` | Email SMTP | — |
| `MAIL_PASSWORD` | Mot de passe d'application SMTP | — |
| `KONNECT_API_KEY` | Clé API Konnect (paiement tunisien) | — |
| `STRIPE_API_KEY` | Clé API Stripe | — |
| `DOCKER_REGISTRY` | URL du registre Docker | `localhost:5000` |
| `API_GATEWAY_PORT` | Port exposé de l'API Gateway | `8080` |
| `SONAR_HOST` | URL du serveur SonarQube (optionnel) | — |
| `SONAR_TOKEN` | Token SonarQube (optionnel) | — |

---

## 🗃️ Base de Données

Le projet utilise **MongoDB 7.0** comme seule base de données. En Docker Compose, un seul serveur MongoDB est partagé, mais chaque microservice utilise **sa propre collection logique** (ou base de données locale quand exécuté individuellement) :

| Service | Base par Défaut (dev local) | Base en Docker Compose |
|---|---|---|
| Auth Service | `authdb` | `agri_market` |
| User Service | `userdb` | `agri_market` |
| Catalog Service | `MONGO_URI` requis | `agri_market` |
| Order Service | `orderdb` | `agri_market` |
| Payment Service | `paymentdb` | `agri_market` |
| Messaging Service | `msgdb` | `agri_market` |
| Delivery Service | `deliverydb` | `agri_market` |
| Jobs Service | `jobsdb` | `agri_market` |

**Health check MongoDB** configuré dans Docker Compose :
```bash
mongosh --quiet --eval "db.adminCommand('ping').ok"
# Intervalle: 10s, Timeout: 5s, Retries: 10
```

Le volume `mongo-data` persiste les données entre les redémarrages.

---

## ☸️ Déploiement

### Docker Compose (Local / Dev)

```bash
# Démarrer tout le stack
docker compose up --build -d

# Arrêter
docker compose down

# Arrêter et supprimer les volumes
docker compose down -v
```

### Kubernetes (Kustomize)

Le projet inclut des manifestes Kubernetes avec Kustomize pour les environnements **dev** et **prod** :

```
platform/k8s/
├── base/                              # Manifestes de base
│   ├── kustomization.yaml
│   ├── namespace.yaml                 # Namespace agri-dev
│   ├── k8s-secrets.yaml              # Secrets (JWT, MongoDB URI)
│   ├── network-policies.yaml         # Restriction réseau inter-pods
│   ├── network-policies-prod.yaml    # Policies renforcées pour prod
│   ├── monitoring-network-policy.yaml # Policies pour Prometheus
│   ├── auth-service.yaml
│   ├── user-service.yaml
│   ├── catalog-deployment.yaml
│   ├── order-service.yaml
│   ├── payment-service.yaml
│   ├── messaging-service.yaml
│   ├── delivery-service.yaml
│   ├── jobs-service.yaml
│   ├── gateway-deployment.yaml
│   └── frontend-deployment.yaml
├── overlays/
│   ├── dev/                           # Overrides dev
│   └── prod/                          # Overrides production
└── monitoring/                        # Ressources K8s monitoring
```

**Déployer en dev :**
```bash
kubectl apply -k platform/k8s/overlays/dev
# Vérifier le rollout
kubectl -n agri-dev get pods
```

**Déployer en production :**
```bash
kubectl apply -k platform/k8s/overlays/prod
# Vérifier le rollout
kubectl -n agri-prod get pods
```

### Network Policies (Sécurité Réseau K8s)

Le cluster impose un modèle **default-deny-all** avec des exceptions explicites :

| Policy | Règle |
|---|---|
| `default-deny-all` | Bloque tout trafic ingress et egress par défaut |
| `mongodb-network-policy` | Seuls les 8 microservices peuvent accéder au port 27017 |
| `gateway-network-policy` | Ingress : uniquement depuis le frontend. Egress : vers tous les microservices |
| `frontend-network-policy` | Egress : uniquement vers l'API Gateway (port 8080) + DNS (port 53) |
| `monitoring-network-policy` | Prometheus peut scraper tous les services |

---

## 📊 Monitoring et Observabilité

### Prometheus (v2.54.1)

- **URL** : [http://localhost:9090](http://localhost:9090)
- **Configuration** : `monitoring/prometheus.yml`
- Scrape interval : 15s
- Scrape de métriques sur tous les services via `/actuator/prometheus`
- Targets configurés : api-gateway, auth-service, user-service, catalog-service, order-service, payment-service, messaging-service, jobs-service, delivery-service

### Grafana (v11.2.0)

- **URL** : [http://localhost:3000](http://localhost:3000)
- **Identifiants** : `admin` / `admin`
- Datasource Prometheus pré-configurée
- Dashboards pré-provisionnés (`monitoring/grafana/provisioning/`)
- Métriques visualisables : JVM, HTTP request rates, latence, erreurs, métriques métier custom

### Spring Boot Actuator

Chaque service expose :

| Endpoint | Description |
|---|---|
| `/actuator/health` | Statut de santé (UP/DOWN) avec détails |
| `/actuator/info` | Informations sur l'application |
| `/actuator/metrics` | Métriques JVM, HTTP, custom |
| `/actuator/prometheus` | Métriques au format Prometheus |

```bash
# Vérifier la santé de tous les services
curl http://localhost:8080/actuator/health    # API Gateway
curl http://localhost:8087/actuator/health    # Auth Service
curl http://localhost:8088/actuator/health    # User Service
curl http://localhost:8086/actuator/health    # Delivery Service
```

### OpenTelemetry Tracing

Tracing distribué activé via `micrometer-tracing-bridge-otel` sur tous les services backend, permettant de suivre une requête à travers les différents microservices.

---

## 🔄 Pipeline CI/CD

Le projet inclut un **Jenkinsfile** déclaratif complet avec les stages suivants :

```
 ┌──────────┐    ┌──────────────────────┐    ┌──────────────────────┐
 │ Checkout │───►│ Build Microservices  │───►│       Tests          │
 │          │    │ (10 modules en       │    │ (10 modules en       │
 │ Git SCM  │    │  parallèle)          │    │  parallèle)          │
 └──────────┘    └──────────────────────┘    └──────────┬───────────┘
                                                        │
  ┌─────────────────────────────────────────────────────┘
  │
  ▼
 ┌──────────────────┐    ┌─────────────────────┐    ┌────────────────┐
 │ Docker Build     │───►│ Security Scans      │───►│ Security Gates │
 │ & Tag            │    │ • Trivy (container) │    │ • SpotBugs     │
 │ (10 images)      │    │ • SpotBugs (SAST)   │    │ • JaCoCo       │
 │                  │    │ • SonarQube (opt.)  │    │                │
 └──────────────────┘    └─────────────────────┘    └───────┬────────┘
                                                            │
  ┌─────────────────────────────────────────────────────────┘
  │
  ▼
 ┌────────────────┐    ┌───────────────────┐    ┌──────────────────┐
 │ Docker Push    │───►│ Deploy Dev        │───►│ Promote to Prod  │
 │ (registry)     │    │ (branche develop) │    │ (branche main,   │
 │ :latest,       │    │ kubectl apply -k  │    │  approbation     │
 │ :BUILD-SHA,    │    │ overlays/dev      │    │  manuelle)       │
 │ :stable (main) │    └───────────────────┘    └──────────────────┘
 └────────────────┘
```

### Détail des Stages

| Stage | Description |
|---|---|
| **Checkout** | Clone SCM, calcule IMAGE_TAG = `BUILD_NUMBER-GIT_SHA` |
| **Build Microservices** | 10 builds Maven/npm en parallèle (`-DskipTests`) |
| **Test** | 10 suites de tests en parallèle (Maven + Karma ChromeHeadless) |
| **Docker Build & Tag** | Construction de 10 images Docker, tags `latest` + `BUILD-SHA` |
| **Container Security Scan** | Trivy scanne chaque image pour vulnérabilités HIGH/CRITICAL |
| **SAST** | SpotBugs + FindSecBugs analyse statique sur les 8 services Java |
| **SonarQube** | Analyse qualité (conditionnel, si `SONAR_HOST` est défini) |
| **Security Gates** | Vérifie SpotBugs + JaCoCo coverage → bloque si échec critique |
| **Docker Push** | Push vers registre (local `localhost:5000` ou distant) |
| **Deploy Dev** | `kubectl apply -k overlays/dev` (branche `develop` uniquement) |
| **Promote to Prod** | Approbation manuelle + `kubectl apply -k overlays/prod` (branche `main` uniquement) |

### Tags d'images

| Tag | Condition |
|---|---|
| `BUILD_NUMBER-GIT_SHA` | Toujours |
| `latest` | Toujours |
| `stable` | Branche `main` uniquement |

---

## 🔒 Sécurité

### Couches de Sécurité

| Couche | Outil | Description |
|---|---|---|
| **Authentification** | Spring Security + JWT | Auth stateless par tokens, expiration 24h |
| **OAuth 2.0** | Google Sign-In | Connexion via compte Google |
| **Récupération MDP** | SMTP + code aléatoire | Code de vérification envoyé par email |
| **Validation** | Jakarta Validation | Validation des entrées (@Valid, @NotBlank, etc.) |
| **SAST** | SpotBugs + FindSecBugs | Analyse statique du code Java pour bugs de sécurité |
| **SCA** | OWASP Dependency-Check | Détection de CVE dans les dépendances Maven |
| **Container Scan** | Trivy | Scan des images Docker pour vulnérabilités |
| **Code Quality** | Checkstyle (Google) + PMD | Enforcement de style et analyse de code |
| **Coverage** | JaCoCo | Rapport de couverture de tests |
| **Code Quality** | SonarQube (optionnel) | Analyse globale de la qualité |
| **Network Policies** | Kubernetes | Restriction pod-to-pod (default-deny) |
| **Non-Root Containers** | Docker | Tous les conteneurs s'exécutent en UID 1000 |
| **Secrets Management** | K8s Secrets | JWT secret et MongoDB URI dans des Secrets K8s |
| **OWASP Suppressions** | XML | False positives gérés dans `platform/security/owasp-suppressions.xml` |

### Flux d'Authentification

```
1. L'utilisateur s'inscrit via POST /api/auth/signup (email, mot de passe, rôle)
2. L'utilisateur se connecte via POST /api/auth/login (ou /api/auth/google)
3. Le serveur retourne un JWT contenant : id, email, firstName, lastName, role
4. Le frontend stocke le JWT dans localStorage
5. Le JwtInterceptor Angular ajoute le header : Authorization: Bearer <token>
6. Chaque microservice valide le JWT indépendamment avec la même clé secrète
7. L'AuthGuard Angular vérifie le rôle (FARMER/CUSTOMER) avant d'accéder aux routes protégées
```

---

## 📡 Référence API

Toutes les requêtes API passent par l'API Gateway sur `http://localhost:8080`.

| Préfixe | Service | Méthodes Principales |
|---|---|---|
| `/api/auth/**` | Auth Service (8087) | login, signup, google, forgot-password, reset-password |
| `/api/users/**` | User Service (8088) | me, profile, change-password, by-role |
| `/api/products/**` | Catalog Service (8080) | public/all, public/search, CRUD produits |
| `/api/orders/**` | Order Service (8080) | CRUD commandes, status, tracking, rating |
| `/api/payments/**` | Payment Service (8080) | methods, konnect/initiate, konnect/verify |
| `/api/messages/**` | Messaging Service (8080) | conversations, send, read, unread-count |
| `/api/delivery/**` | Delivery Service (8086) | routes, apply, driver-location, farmer-offers |
| `/api/jobs/**` | Jobs Service (8080) | CRUD offres, apply, applications |
| `/api/stats/**` | API Gateway (local) | global (statistiques agrégées) |
| `/ws/**` | Messaging Service (WebSocket) | STOMP endpoint avec SockJS fallback |
| `/actuator/**` | Tous les services | health, info, metrics, prometheus |

---

## 📁 Structure du Projet

```
agri-marketplace/
│
├── frontend/                          # Angular 17 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                  # Services, guards, interceptors, modèles
│   │   │   │   ├── guards/            # AuthGuard (rôles FARMER/CUSTOMER)
│   │   │   │   ├── interceptors/      # JwtInterceptor (injection token)
│   │   │   │   ├── services/          # 13 services Angular
│   │   │   │   ├── models/            # Interfaces TypeScript (User, Order, Product, etc.)
│   │   │   │   └── animations/        # Animations Framer Motion
│   │   │   ├── features/              # 15 modules fonctionnels (lazy-loaded)
│   │   │   │   ├── auth/              # Login, signup, forgot-password
│   │   │   │   ├── home/              # Landing page + stats dynamiques
│   │   │   │   ├── marketplace/       # Catalogue produits
│   │   │   │   ├── product-detail/    # Détail produit
│   │   │   │   ├── cart/              # Panier + checkout
│   │   │   │   ├── farmer-dashboard/  # Dashboard ferme (add-product, farmer-orders)
│   │   │   │   ├── buyer-dashboard/   # Dashboard acheteur
│   │   │   │   ├── orders/            # Gestion commandes + order-tracking
│   │   │   │   ├── messages/          # Chat temps réel
│   │   │   │   ├── payment/           # Payment settings + résultat Konnect
│   │   │   │   ├── logistics/         # Gestion routes livraison (fermier)
│   │   │   │   ├── buyer-logistics/   # Offres logistique (acheteur)
│   │   │   │   ├── jobs/              # Offres emploi (créer, détail, liste)
│   │   │   │   ├── buyer-jobs/        # Offres emploi (acheteur)
│   │   │   │   └── profile/           # Profil utilisateur
│   │   │   └── shared/                # Composants partagés (navbar, product-card,
│   │   │       └── components/        #   map-picker, toast, skeleton, pagination)
│   │   ├── environments/              # environment.ts / environment.prod.ts
│   │   ├── styles.css                 # Styles globaux (Tailwind)
│   │   └── index.html
│   ├── Dockerfile                     # Multi-stage: Node 20 build → Nginx Alpine
│   ├── nginx.conf.template            # Reverse proxy API + WebSocket
│   ├── tailwind.config.js
│   ├── angular.json
│   └── package.json
│
├── gateway/
│   └── api-gateway/                   # Spring Cloud Gateway (réactif)
│       ├── src/main/
│       │   ├── java/.../gateway/
│       │   │   └── controller/
│       │   │       └── StatsController.java  # Agrégation statistiques
│       │   └── resources/
│       │       └── application.yml    # Routes, CORS, WebSocket proxy
│       ├── Dockerfile
│       └── pom.xml
│
├── services/
│   ├── auth-service/                  # JWT + Google OAuth + SMTP
│   ├── user-service/                  # Profils + rôles (FARMER/CUSTOMER/ADMIN)
│   ├── catalog-service/               # Catalogue produits (CRUD + search)
│   ├── order-service/                 # Commandes + tracking GPS + rating
│   ├── payment-service/               # Konnect + Stripe + méthodes de paiement
│   ├── messaging-service/             # Chat STOMP/WebSocket + conversations
│   ├── delivery-service/              # Logistique + routes + candidatures
│   └── jobs-service/                  # Offres emploi + candidatures
│   (Chaque service contient : Dockerfile, pom.xml, src/)
│
├── platform/
│   ├── k8s/
│   │   ├── base/                      # 16 manifestes K8s (deploy, svc, netpol)
│   │   ├── overlays/dev/              # Overrides environnement dev
│   │   ├── overlays/prod/             # Overrides environnement production
│   │   ├── monitoring/                # Ressources monitoring K8s
│   │   └── k8s-secrets.yaml           # Template de secrets
│   └── security/
│       └── owasp-suppressions.xml     # Suppressions OWASP false positives
│
├── monitoring/
│   ├── prometheus.yml                 # Config scrape (9 targets, 15s interval)
│   └── grafana/
│       └── provisioning/              # Datasources + dashboards Grafana
│
├── scripts/
│   ├── run-all.sh                     # Build complet + push + compose
│   ├── run-locally.sh                 # Dev local avec registre Docker
│   ├── jenkins/                       # Setup Jenkins local
│   └── k8s/                           # Scripts helpers Kubernetes
│
├── .github/                           # GitHub config (workflows)
├── docker-compose.yml                 # 12 conteneurs (stack complet)
├── Jenkinsfile                        # Pipeline CI/CD (390 lignes)
├── run-project.sh                     # Script de démarrage rapide
├── .env.example                       # Template variables d'environnement
├── .gitignore                         # Exclusions Git
└── README.md
```

---

## 🤝 Contribuer

1. **Fork** le dépôt
2. **Créer** une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commiter** vos changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. **Pousser** la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Ouvrir** une Pull Request vers `develop`

### Conventions de Développement

- Suivre le **Google Java Style Guide** (appliqué via Checkstyle)
- S'assurer que tous les tests passent avant de soumettre une PR
- Garder les services faiblement couplés — communiquer via l'API Gateway ou les événements HTTP
- Utiliser des messages de commit significatifs
- Ajouter des tests unitaires pour les nouvelles fonctionnalités
- Les réponses API suivent le format `ApiResponse(success, message, data?)`

### Branchement

| Branche | Rôle |
|---|---|
| `main` | Production — déploiement avec approbation manuelle |
| `develop` | Développement — déploiement automatique vers dev |
| `feature/*` | Fonctionnalités en cours |

---

## 📄 Licence

Ce projet est sous licence MIT — voir le fichier [LICENSE](LICENSE) pour les détails.

---

<div align="center">

**Construit avec ❤️ pour la communauté agricole tunisienne**

🌾 *De la ferme à votre table, sans intermédiaire* 🌾

</div>
]]>
