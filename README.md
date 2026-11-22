# settings-react-backend

UX backoffice **React** de l'application [Settings](https://tiogars.github.io/settings/) —
distribution centralisée du paramétrage aux applications et microservices consommateurs.

Implémente les écrans E01 à E12 des spécifications (`tiogars/settings`) :

| Écran | Description |
|---|---|
| E01 | Connexion SSO + **accès en mode démo** (jeu de données local, sans backend) |
| E02 | Tableau de bord : compteurs, complétude par application, dernières modifications, favoris |
| E03 | Liste des applications : filtres, pastilles d'environnement, jauge de complétude |
| E04/E05 | Fiche application : description, composants, environnements, paramétrage, clients API, historique |
| E06 | Éditeur de paramétrage : arbre des 17 familles, formulaire **généré depuis le schéma**, bandeau brouillon, aperçu JSON (secrets masqués) |
| E07 | Éditeur Key/Value : catégories, grille éditable en ligne |
| E08 | Comparaison et recopie : source/cible, mode, périmètre, écarts colorés, confirmation renforcée vers un environnement protégé |
| E09 | Historique : versions publiées, comparaison entre deux versions, rollback |
| E10 | Clients API : création (secret affiché une seule fois), rotation, révocation |
| E11 | Recherche avancée : facettes, préfixes `env:` `app:` `famille:` `secret:oui`, lien partageable |
| E12 | Audit : filtres (acteur, action, objet, période), export CSV |

Recherche globale accessible partout avec `Ctrl+K` (palette de commandes).

## Mode démo

Sur l'écran de connexion, le bouton **« Accéder en mode démo »** charge un jeu de données
fictif en mémoire : toutes les fonctionnalités sont utilisables sans IdP ni backend.
Aucune donnée réelle n'est modifiée. La session est conservée en `sessionStorage`
(fermée avec l'onglet) ; les secrets ne sont jamais affichés ni indexés.

## Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev)
- [MUI](https://mui.com) (Material, X Data Grid, X Charts, X Date Pickers, X Tree View)
- [Redux Toolkit](https://redux-toolkit.js.org) + react-redux (état, audit par `extraReducers`)
- [React Router](https://reactrouter.com) (routes paresseuses, lien partageable)
- [react-hook-form](https://react-hook-form.com) (validation en direct des formulaires)
- [Luxon](https://moment.github.io/luxon/) (dates, locale fr)
- [Vitest](https://vitest.dev) (tests unitaires) et [Oxlint](https://oxc.rs) (lint)

## Commandes

```bash
pnpm install     # dépendances
pnpm dev         # serveur de développement (http://localhost:5173)
pnpm test        # tests unitaires (vitest)
pnpm lint        # lint (oxlint)
pnpm build       # vérification des types (tsc) + build de production
pnpm preview     # prévisualisation du build
```

## Structure

```text
src/
  app/            # store Redux, hooks typés, persistance de session
  components/     # layout (AppBar + navigation), palette Ctrl+K, pastille d'environnement
  data/           # schémas des 17 familles de paramètres, jeu de données démo
  features/       # un dossier par fonctionnalité (auth, apps, settings, promotion, clients, search, audit, dashboard)
  utils/          # formatage des dates (Luxon), moteur de recherche
```
