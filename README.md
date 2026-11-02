# France Distribution

## Accès sans connexion (par défaut)

L’application s’ouvre directement sur le stock. Les articles, commandes, réceptions et ventes sont enregistrés dans le navigateur, sur cet appareil, sans compte ni mot de passe. Aucune donnée Firebase n’est lue, importée ou rendue publique. Effacer les données du navigateur supprime ces enregistrements ; un autre navigateur ou appareil possède un stock indépendant. Utilisez localhost ou HTTPS avec un navigateur récent (Web Locks).

Pour retrouver volontairement le fonctionnement Firebase avec authentification, définissez `VITE_DATA_MODE=firebase` dans `.env` puis redémarrez Vite. Les instructions Firebase ci-dessous concernent uniquement ce mode.

Test du mode sans connexion : `npx playwright test --config playwright.local.config.js`.

Gestion de stock, commandes, réceptions et caisse avec React, Vite, Firebase Authentication et Cloud Firestore. Les collections métier peuvent être entièrement vides au démarrage.

## Installation

Node **22 ou supérieur** est nécessaire, notamment pour les outils d’administration Firebase. Avec fnm :

```bash
fnm install 22
fnm use 22
npm ci
```

## Nouveau projet Firebase : première connexion

1. Dans la console Firebase, sélectionnez votre **nouveau projet**.
2. Dans **Paramètres du projet → Général → Vos applications**, ajoutez une application **Web**. Copiez sa configuration dans `.env` en reprenant les noms de `.env.example`. Si `.env` existe déjà, remplacez les valeurs de l’ancien projet ; ne mélangez pas deux projets.
3. Dans **Authentication → Sign-in method**, activez **Adresse e-mail/Mot de passe**.
4. Dans **Firestore Database**, créez la base **`(default)`**, en mode natif / édition Standard. Choisissez la région adaptée. Aucune collection métier ni donnée d’exemple n’est nécessaire.
5. Déployez les règles de ce dépôt en indiquant explicitement le projet :

```bash
npx firebase login
npx firebase deploy --only firestore:rules --project VOTRE_ID_PROJET
```

6. Créez le premier administrateur avec l’une des méthodes ci-dessous.
7. Lancez `npm run dev`, puis ouvrez l’adresse affichée. Connectez-vous avec l’email et le mot de passe du compte créé. Un stock vide est normal.

### Méthode simple : console Firebase

- **Authentication → Users → Ajouter un utilisateur** : créez le compte avec un email et un mot de passe, puis copiez son **UID**.
- **Firestore Database → Données → Démarrer une collection** : nommez-la **`profiles`**.
- Donnez au document l’identifiant **exact de l’UID Auth**, pas un identifiant automatique.
- Ajoutez les champs suivants, tous de type **string** :

| Champ | Valeur |
| --- | --- |
| `username` | `Administrateur` |
| `role` | `admin` |
| `website` | chaîne vide |
| `avatar_url` | chaîne vide |

Le champ `role` est sensible à la casse : utilisez exactement `admin`. Il n’y a pas d’inscription publique ni d’attribution du rôle administrateur depuis l’application.

### Méthode alternative : script local sécurisé

Dans **Paramètres du projet → Comptes de service → SDK Admin Firebase**, générez une clé privée pour votre nouveau projet et conservez le fichier **hors du dépôt**. Ne la mettez jamais dans `.env`, dans `src`, ni dans une variable `VITE_*`.

```bash
npm run setup:admin -- --project VOTRE_ID_PROJET --email votre-email@example.com --credentials /chemin/hors-du-depot/service-account.json
```

Le script vérifie que le projet du fichier de clé correspond à `--project` et à `.env`. Il demande et confirme le mot de passe sans l’afficher, crée le compte Auth et son profil administrateur. Un compte Auth déjà créé peut être complété avec son profil, sans changer son mot de passe. Le script refuse de créer un autre premier administrateur si un administrateur différent existe déjà. Des identifiants Google Application Default Credentials peuvent remplacer `--credentials`.

Si la base Firestore n’a pas encore été créée, faites d’abord l’étape 4. Le script ne crée pas le projet ni la base.

## Premier parcours métier

1. **Créer un article** : saisir le nom, les prix d’achat et de vente en **FCFA**, et éventuellement un code-barres. La caméra et OpenFoodFacts sont facultatifs. Le stock initial est zéro.
2. **Mes commandes → Nouvelle commande** : sélectionner l’article et une quantité entière positive.
3. **Réceptionner** : renseigner la quantité réellement reçue. Une réception partielle conserve la quantité restante ; une réception complète retire la commande en cours. L’historique garde les opérations.
4. **Caisse** : démarrer une vente, ajouter les articles avec leur code-barres, ajuster les quantités et finaliser. Une vente exige un prix de vente positif et un stock suffisant. Le reçu PDF se télécharge séparément après l’enregistrement.

Les articles sans code-barres peuvent être gérés dans le stock et les commandes ; la caisse actuelle utilise un code-barres pour les ajouter. Aucun produit fictif n’est ajouté à votre projet.

## Remises par produit

Dans la caisse, chaque ligne possède une remise à zéro par défaut. Choisissez **%** ou **FCFA**, puis saisissez sa valeur. La remise porte sur le total de la ligne (`quantité × prix unitaire`), pas sur une seule unité.

- En pourcentage, la remise se recalcule avec la quantité. En FCFA, le montant reste fixe pour toute la ligne.
- Changer le type de remise remet sa valeur à zéro pour éviter de convertir accidentellement un montant en pourcentage.
- Les montants négatifs, les pourcentages supérieurs à 100 et les remises supérieures au total de la ligne bloquent la validation. Une remise de 100 % est autorisée.
- Les remises restent présentes lors d’un nouveau scan du même article et lors du rechargement de l’onglet.
- Le reçu indique le brut, la remise et le net par produit, puis les totaux. Les prix du catalogue ne changent pas ; seules les quantités vendues sont déduites du stock.

Exemple : 10 articles à 1 000 FCFA avec 10 % de remise donnent 9 000 FCFA ; 5 articles à 2 000 FCFA avec une remise de ligne de 500 FCFA donnent 9 500 FCFA. Le net à payer est **18 500 FCFA**.

Avant d’utiliser cette version sur le projet réel, déployez les règles mises à jour :

```bash
npx firebase deploy --only firestore:rules --project inside-d5e59
```

## Fiabilité et permissions

- Seuls les profils `admin` accèdent aux données métier. Chaque utilisateur connecté peut lire et modifier les champs autorisés de son propre profil, sans changer son rôle.
- Les ventes, commandes et réceptions utilisent des transactions Firestore. Les stocks sont relus pendant la transaction pour gérer les opérations concurrentes.
- Les références d’opération empêchent une nouvelle tentative de réenregistrer la même opération. Les brouillons de caisse sont conservés dans l’onglet et supprimés à la déconnexion.
- Les reçus de vente et l’historique sont immuables depuis le client.
- Les recherches exactes utilisent les filtres Firestore ; les accès par identifiant lisent un document. Le catalogue est chargé pour la recherche locale et affiché par pages de 25 articles. Une pagination serveur sera nécessaire pour des catalogues très volumineux.
- Les modules PDF et caméra sont chargés à la demande.

Les règles doivent être déployées sur votre projet pour que ces restrictions s’appliquent à sa base. Le dépôt seul ne modifie aucune règle distante.

## Vérifications

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev
```

Les tests de règles et de concurrence nécessitent **Java 21+** et les émulateurs Firebase :

```bash
npm run test:emulator
```

Les tests n’utilisent que le projet fictif `demo-france-distribution`. Ils effacent les données de l’émulateur à chaque scénario, jamais celles d’un projet Firebase réel.

Pour tester le navigateur, démarrez les émulateurs dans un terminal :

```bash
npm run emulators
```

Puis, dans un autre terminal :

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright démarre son serveur Vite avec une configuration locale dédiée : il ne remplace pas `.env`. Le port 4173 doit être libre.

## Dépannage

- **Écran de configuration** : compléter les variables de `.env`, puis redémarrer Vite.
- **Connexion impossible** : vérifier l’activation Email/Password, la présence du compte Auth et la configuration du bon projet.
- **Accès réservé aux administrateurs** : vérifier `profiles/{UID}` et le champ string `role: admin`.
- **Impossible de charger le profil / permissions refusées** : vérifier la base `(default)` et déployer les règles sur le bon projet.
- **Caméra inaccessible** : autoriser la caméra et utiliser HTTPS ou localhost, ou saisir le code-barres manuellement.
- **Audit npm complet** : les outils de développement Firebase conservent une alerte transitive modérée sur `stream-json` (également remontée sur `firebase-tools`). La version corrigée change son API et ne peut pas remplacer directement celle du CLI. L’application livrée au navigateur ne l’utilise pas ; ne lancez pas d’import Firebase sur des fichiers JSON non fiables. Recontrôler cette alerte lors des prochaines mises à jour du CLI.
# france_distribution
