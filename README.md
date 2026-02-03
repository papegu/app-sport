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

### Vercel (monorepo: sous-dossier `applisport`)
- Root Directory: définissez-le sur `applisport` dans Vercel → Project Settings → General → Root Directory, puis « Save ».
- Framework Preset: Next.js (détecté automatiquement).
- Build Command: laissez vide ou `npm run build` (dans `applisport`).
- Install Command: laissez vide ou `npm ci`.
- Output: auto (Next.js). Ne pas fixer manuellement.
- Variables d’environnement (Project Settings → Environment Variables):
	- `NEXTAUTH_URL` = `https://<votre-domaine>`
	- `NEXTAUTH_SECRET` = valeur aléatoire forte
	- `DATABASE_URL` = URL Postgres (Neon), avec `sslmode=verify-full`
	- `DIRECT_URL` = même valeur que `DATABASE_URL` (ou URL directe Postgres), avec SSL
	- (Optionnel) clés PayDunya si passage en réel

Après sauvegarde, redeployez la branche `main`.

### Vérifications production
Après déploiement, vérifiez que les endpoints répondent:

```
curl -sSf https://<votre-domaine>/api/version
curl -sSf https://<votre-domaine>/api/health/env
curl -sSf https://<votre-domaine>/api/health/db
```

La page `/login` doit être accessible (redirigée depuis `/`). Si vous obtenez `404 NOT_FOUND`, c’est quasi toujours un Root Directory mal configuré (le projet Vercel pointe la racine du repo au lieu de `applisport`).

## Notes
- Les services SMS/Email sont mockés (à implémenter selon fournisseur).
- Les reçus et exports sont générés côté client.

## Charte Graphique (logo et couleurs)
- Logo: image locale basée sur le drapeau du Gabon ([public/images/gabon.jpg](public/images/gabon.jpg)), utilisée dans [src/components/Nav.tsx](src/components/Nav.tsx).
- Palette (drapeau du Gabon):
	- Primaire (Vert): `#009E60`
	- Accent (Bleu): `#1F57A4`
	- Highlight (Or): `#FCD116`
	- Fond neutre: `#f8f8f8`
	- Texte: `#171717`
- Implémentation:
	- Variables CSS dans [src/app/globals.css](src/app/globals.css): `--brand-primary` (vert), `--brand-secondary` (bleu), `--brand-accent` (or).
	- Mappage Tailwind v4: `--color-primary-*` (vert), `--color-accent-*` (bleu), `--color-highlight-*` (or).
	- Les classes `text-primary-*`, `bg-primary-*`, `border-primary-*` appliquent le vert; `*-accent-*` appliquent le bleu; `*-highlight-*` disponibles pour des touches d’or.

Note droits: l’image du drapeau est un symbole national. Vérifiez les contraintes d’usage selon votre contexte (usage non commercial recommandé pour cet actif).
