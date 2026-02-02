# gym.local

[![CI](https://github.com/papegu/app-sport/actions/workflows/ci.yml/badge.svg)](https://github.com/papegu/app-sport/actions/workflows/ci.yml)
[![Preview Deploy](https://github.com/papegu/app-sport/actions/workflows/vercel-preview.yml/badge.svg)](https://github.com/papegu/app-sport/actions/workflows/vercel-preview.yml)

# Appli Sport – Gestion de salle de sport

Application Next.js (App Router) en TypeScript avec Tailwind, Auth (NextAuth), Prisma et PostgreSQL.

# app-sport


## Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Auth: NextAuth (Credentials)
- Base: PostgreSQL
- ORM: Prisma
- Exports: PDF (jsPDF), Excel (xlsx)

## Démarrage (local)
1. Créez et renseignez `.env` (exemple Neon):
```
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<database>?sslmode=verify-full"
DIRECT_URL="postgresql://<user>:<password>@<neon-host>/<database>?sslmode=verify-full"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="remplacez-par-un-secret-sécurisé"
```
Remplacez `<user>`, `<password>`, `<neon-host>` et `<database>` par vos valeurs Neon.
Note SSL: nous explicitons `sslmode=verify-full` pour des garanties fortes. Pour compatibilité libpq, utilisez `uselibpqcompat=true&sslmode=require`.
2. Générer Prisma et pousser le schéma:
```
npm run prisma:generate
npm run db:push
```
3. Seed de données de démonstration:
```
npm run db:seed
```
4. Lancer le serveur:
```
npm run dev
```

Utilisez `admin@gym.local` / `admin123` pour vous connecter.

## RBAC (rôles)
- ADMIN: accès total
- ACCUEIL: modules Membres, Abonnements, Paiements, Accès, Cours
- DIRECTION: Dashboard et Rapports

La protection par rôle est appliquée via `middleware.ts`.

## Modules
- Dashboard: statistiques rapides
- Membres: CRUD + statut
- Abonnements: création et renouvellement
- Paiements: listing + reçus PDF
- Accès: QR par membre + simulation scan
- Cours: planning + présence
- Rapports: métriques + export PDF/Excel
- Paramètres: réservé admin

## Déploiement
Compatible Vercel/VPS. Assurez-vous de renseigner les variables d'environnement et d'exécuter les migrations Prisma.

## Notes
- Les services SMS/Email sont mockés (à implémenter selon fournisseur).
- Les reçus et exports sont générés côté client.
