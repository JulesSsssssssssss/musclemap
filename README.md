# MuscleMap

Portage en Next.js du template MuscleMap : on touche un muscle sur une carte du
corps, on descend jusqu'au faisceau, on choisit un exercice, on le pousse dans la
séance du jour, et tout ce qui est validé alimente la progression.

Les neuf écrans de la maquette sont repris à l'identique (couleurs, typos,
silhouette SVG, minuteur de repos, toasts), mais branchés sur une vraie base de
données et un vrai compte utilisateur.

## Démarrer

```bash
npm install
cp .env.example .env        # renseigne AUTH_SECRET
npx prisma migrate deploy   # crée prisma/dev.db
npm run db:seed             # 65 exercices + compte de démo
npm run dev
```

Compte de démonstration : **demo@musclemap.app** / **demo1234** — livré avec
36 séances d'historique pour que la progression et les records aient du contenu.

## Pile

| | |
|---|---|
| Framework | Next.js 16, App Router, React 19, Server Actions |
| Base | Prisma 6 + SQLite (`DATABASE_URL` suffit à passer sur PostgreSQL) |
| Auth | JWT maison (`jose`) en cookie httpOnly, mots de passe `bcryptjs` |
| Styles | CSS variables + styles inline, pas de framework CSS |

## Écrans

| Route | Écran du template |
|---|---|
| `/` | accueil — carte du corps face / dos, cliquable |
| `/muscle/[muscle]` | groupe musculaire et ses faisceaux |
| `/muscle/[muscle]/[sub]` | exercices ciblés, filtres équipement / niveau |
| `/exercice/[slug]` | fiche : exécution, conseils, erreurs, variantes |
| `/seance` | séance en cours : séries, poids, reps, repos |
| `/seance/[id]/resume` | résumé : volume, muscles travaillés, records |
| `/progression` | courbe de charge, records, répartition, historique |
| `/biblio` | bibliothèque complète, recherche et filtres |
| `/profil` | stats, unité kg/lb, minuteur, export CSV |

## Modèle de données

`User` → `Workout` → `WorkoutExercise` → `WorkoutSet`, plus `Exercise`
(catalogue partagé) et `PersonalRecord` (charge, reps, volume, 1RM estimé,
recalculés à la clôture de chaque séance).

La géométrie de la carte musculaire vit dans `lib/body.ts`, le catalogue des
faisceaux dans `lib/catalog.ts`, et les exercices de démarrage dans
`prisma/exercises.ts`.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run db:seed` | (re)remplit le catalogue et le compte de démo |
| `npm run db:studio` | Prisma Studio |
| `npm run e2e` | test de fumée Playwright (dev server requis) |

## Avant la mise en production

- `AUTH_SECRET` : générer avec `openssl rand -base64 32`.
- Passer `datasource db` sur PostgreSQL et rejouer les migrations.
- Les vignettes d'exercice sont des placeholders « GIF » — brancher de vraies
  images ou vidéos.
- L'authentification est volontairement minimale (e-mail + mot de passe).
  `lib/auth.ts` est isolé pour pouvoir passer à Auth.js / OAuth sans toucher
  aux écrans.
