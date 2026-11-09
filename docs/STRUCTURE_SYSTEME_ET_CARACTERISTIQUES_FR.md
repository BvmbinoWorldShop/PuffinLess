# PuffinLess — Manuel d'Architecture Système & Spécifications des Caractéristiques

**Version :** 2.1 (Édition Durcie : Chiffrement du Journal, Résilience Fail-Visibly & Lisibilité du Centre Financier)  
**Classification :** Spécification d'Architecture Système Fondamentale  
**Paradigme Architectural :** 100% Embarqué (On-Device), Hors-Ligne (Offline-First), Zéro Télémétrie, Event Sourcing Chiffré & Persistance Multi-Niveaux  
**Auteurs :** Équipe DeepMind Advanced Agentic Coding en Binôme de Programmation

---

## 1. Vue d'Ensemble & Philosophie Fondamentale

PuffinLess est une application web clinique autonome de sevrage tabagique, nicotinique (vapes/puffs), cannabique et d'habitudes personnalisées. Contrairement aux applications commerciales habituelles qui stockent les profils de santé sur des serveurs distants et utilisent des traqueurs d'analyse tiers, PuffinLess applique un principe absolu de **Confidentialité par Conception (Privacy-by-Design)** et de **Traitement 100% Local**.

### Caractéristiques Fondamentales
1. **Zéro Dépendance Réseau Externe (100% Hors-Ligne)** : Tous les calculs, l'indexation, le stockage, les chiffrements et les indicateurs cliniques sont exécutés exclusivement dans le navigateur de l'utilisateur. Aucune requête ne quitte l'appareil.
2. **Journal d'Événements Immuable et Chiffré au Repos (Encrypted Event Sourcing)** : Chaque action utilisateur est enregistrée sous forme d'événement discret et monotone dans un journal IndexedDB dédié (`events_store`), intégralement chiffré au repos avec Web Crypto AES-GCM 256 bits. Garantit la rejouabilité totale, la résilience aux pannes, la stricte monotonie des séquences et la confidentialité absolue des données de santé.
3. **Politique d'Échec Visible (Fail-Visibly)** : Toutes les opérations du journal et du coffre échouent de manière visible. Les échecs d'écriture critiques ne sont jamais masqués en silence ; si la persistance ou le chiffrement échoue, une exception explicite se propage immédiatement pour avertir l'application et prévenir tout état optimiste corrompu.
4. **Persistance Multi-Niveaux en Défense Approfondie** : Les données sont protégées simultanément sur quatre niveaux logiques et physiques : magasin Clé-Valeur IndexedDB, Journal d'Événements Chiffré IndexedDB, LocalStorage v2 chiffré, et Snapshot de Sauvetage Local non modifiable.
5. **Chiffrement Authentifié Matériel AES-GCM (Web Crypto API)** : Chiffrement militaire matériel utilisant des clés non extractibles de 256 bits (`crypto.subtle`), un vecteur d'initialisation (IV) dynamique unique de 96 bits par opération et un hachage de sécurité PBKDF2 (100 000 itérations).
6. **Protection Anti-Troncature Stricte & Gestion Réelle des Erreurs** : L'enregistrement d'un tableau vide est bloqué si des données ou des erreurs de déchiffrement existent. Les corruptions et erreurs disque lèvent des exceptions explicites (`DecryptionError`, `Error`) et ne sont jamais confondues avec des données absentes.
7. **Rapports de Récupération Honnêtes et Détaillés** : Le moteur de récupération compare l'état antérieur et les nouvelles découvertes, indique si les données étaient déjà intactes, détaille les sources analysées et valide l'authenticité temporelle des dates.
8. **Ergonomie Visuelle & Typographie Blanche Haute Lisibilité** : Les vues analytiques et financières critiques, notamment le Centre Financier (`MoneyView.tsx`), adoptent une typographie blanche contrastée (`text-white`, `text-white/95`, `text-white/90`) assurant une lisibilité absolue en toutes conditions d'éclairage.
9. **Distribution Monofichier Autonome** : Compilation en un unique fichier `.html` obfusqué et autonome (`dist/standalone.html`) intégrant polices et styles WOFF2 locaux, exécutable sans installation sur tout navigateur.

---

## 2. Diagramme Global de l'Architecture Système

```mermaid
flowchart TD
    subgraph UI_Layer ["Couche Présentation & Interface (React 19 + Tailwind v4)"]
        UI_Dash["Tableau de bord & Cadran de sobriété"]
        UI_Log["Enregistreur de prises (Cigarettes, Vapes, Cannabis)"]
        UI_Money["Centre Financier & Typographie Haute Lisibilité (MoneyView)"]
        UI_SOS["Protocole SOS Urgence Pulsion (180 secondes)"]
        UI_Cert["Certificat Clinique & Métriques Périodiques"]
        UI_Modals["Modales Profil, Code PIN & Mode Récupération"]
    end

    subgraph State_Layer ["Couche État & Réactivité (useAppStore)"]
        AppStore["Hook Central useAppStore"]
        SyncHydrate["Phase 1 : Hydratation Synchrone (Anti-Flash)"]
        AsyncHydrate["Phase 2 : Hydratation Asynchrone IndexedDB"]
        SeqRestore["Redémarrage : restoreJournalSequence()"]
        CalcEngine["Moteur d'Analyse Clinique (obsidianCore)"]
    end

    subgraph Journal_Layer ["Moteur Event Sourcing en Ajout Seul (journal.ts)"]
        RecEvent["recordJournalEvent() (Fail-Visibly)"]
        ReplayEngine["replayJournalEvents() (Annulation Multi-Entités)"]
        SeqCounter["Compteur Monotone (Restauré depuis le disque)"]
        ReadStatus["getHistoricalJournalEventsWithStatus() ('empty'|'success'|'error')"]
    end

    subgraph Storage_Queue ["Sérialisation & Barrière de Concurrence (storage.ts)"]
        FIFO["storageQueue (File d'attente FIFO de Promises)"]
        Guard["verifySafeEmptyOverwrite (Garde Anti-Troncature)"]
        UnionMerge["Opérateurs d'Union (mergeSubstances, etc.)"]
    end

    subgraph Crypto_Layer ["Coffre Cryptographique Sécurisé (crypto.ts)"]
        WebCrypto["Web Crypto API (AES-GCM 256 bits)"]
        NonExtract["CryptoKey Non Extractible (IndexedDB Vault)"]
        PBKDF2["Hachage PBKDF2 (100k itérations + Sel)"]
        LockMgr["Gestionnaire de Verrouillage (Purge Mémoire Vive)"]
    end

    subgraph Physical_Storage ["Sous-Système de Stockage Physique Multi-Niveaux"]
        IDB_KV["IndexedDB : kv_store (puffinless_indexeddb)"]
        IDB_Events["IndexedDB : events_store (Chiffré AES-GCM au repos)"]
        IDB_Vault["IndexedDB : key_vault (Stockage de la CryptoKey)"]
        Local_V2["localStorage : puffinless_*_v2 (Secours Chiffré)"]
        Rescue_Snap["localStorage : puffinless_device_rescue_backup_v2"]
        Session_Store["sessionStorage : Verrouillage Éphémère de Session"]
    end

    UI_Dash --> AppStore
    UI_Log --> AppStore
    UI_Money --> AppStore
    UI_SOS --> AppStore
    UI_Cert --> CalcEngine
    UI_Modals --> AppStore

    AppStore --> SyncHydrate
    AppStore --> AsyncHydrate
    AppStore --> SeqRestore
    AppStore --> RecEvent
    AppStore --> FIFO

    SeqRestore --> SeqCounter
    RecEvent --> SeqCounter
    RecEvent --> WebCrypto
    WebCrypto --> IDB_Events
    ReadStatus <-- IDB_Events
    ReplayEngine <-- ReadStatus

    FIFO --> Guard
    Guard --> UnionMerge
    UnionMerge --> WebCrypto

    WebCrypto <--> NonExtract
    NonExtract <--> IDB_Vault
    UI_Modals <--> PBKDF2

    WebCrypto --> IDB_KV
    WebCrypto --> Local_V2
    UnionMerge --> Rescue_Snap
    LockMgr --> Session_Store
```

---

## 3. Décomposition Structurelle & Caractéristiques par Module

### 3.1. Moteur Cryptographique de Sécurité (`src/utils/crypto.ts`)
Le cœur cryptographique garantit la stricte confidentialité, l'authenticité et la non-extractibilité des journaux de dépendance.

| Caractéristique | Spécification | Détail d'Implémentation |
|---|---|---|
| **Algorithme de Chiffrement** | AES-GCM (Galois/Counter Mode) | Clé standard 256 bits, balise d'authentification 128 bits |
| **Extractibilité de la Clé** | `extractable: false` | Appliqué à la génération ; les octets bruts ne peuvent être lus par un script |
| **Persistance de la Clé** | IndexedDB `puffinless_key_vault` | Stocké comme objet natif structuré `CryptoKey` ; jamais dans `localStorage` |
| **Génération du Vecteur d'IV** | Dynamique 96 bits (12 octets) par écriture | `crypto.getRandomValues(new Uint8Array(12))` garantit l'unicité de chaque ciphertext |
| **Enveloppe du Ciphertext** | `aes-gcm:<ivHex>:<ciphertextBase64>` | Identifie le mode de chiffrement et contient l'IV explicite |
| **Séparation des Résultats** | `readWithStatus` / `decryptWithStatus` | Retourne `'absent'`, `'success'`, ou `'decryption_error'` (ne s'écrase jamais en null) |
| **Purge de la Mémoire Vive** | `lockCryptographicVault()` | Efface `cachedCryptoKey` et `inMemoryKeyStore` lors du verrouillage/redémarrage |
| **Rétrocompatibilité** | `aes256:` (CryptoJS AES-CBC) | Migration automatique et transparente vers AES-GCM dès la première écriture |
| **Déchiquetage Cryptographique** | Destruction irrévocable de la clé | `purgeVaultKeys()` détruit la clé maîtresse, rendant les données disque indéchiffrables |

---

### 3.2. Journal d'Événements Immuable et Chiffré (`src/utils/journal.ts` & `src/utils/indexedDb.ts`)
PuffinLess implémente l'architecture d'Event Sourcing pour neutraliser les écrasements de données et les courses concurrentes, tout en protégeant l'ensemble de l'historique par un chiffrement au repos.

```
+--------------------------------------------------------------------------------------------------------------------+
|                                                  events_store                                                      |
+-----+-----------------------+--------------------------+----------+------------------------------------------------+
| seq | type                  | timestamp                | entityId | ciphertext (charge utile chiffrée AES-GCM)     |
+-----+-----------------------+--------------------------+----------+------------------------------------------------+
| 1   | PROFILE_UPDATED       | 2026-02-10T08:00:00.000Z | user     | aes-gcm:d4e9a...:82fba7c10b...                |
| 2   | SUBSTANCE_LOGGED      | 2026-02-10T09:30:00.000Z | sub-1    | aes-gcm:90cf1...:1a2c5e7b8f...                |
| 3   | CRAVING_LOGGED        | 2026-02-10T11:15:00.000Z | crav-1   | aes-gcm:31bb4...:90de8812c3...                |
| 4   | SUBSTANCE_REMOVED     | 2026-02-10T12:00:00.000Z | sub-1    | aes-gcm:48fa2...:e43a912bb0...                |
| 5   | SAVINGS_GOAL_ADDED    | 2026-02-10T14:00:00.000Z | goal-1   | aes-gcm:77ac9...:7d8a9e145c...                |
+-----+-----------------------+--------------------------+----------+------------------------------------------------+
                                          |
                                          v
                              idbGetAllEventsWithStatus()
                       (Distinction 'empty' | 'success' | 'error')
                                          |
                                          v
                                replayJournalEvents()
                                          |
                                          v
        +------------------------------------------------------------------+
        | Projections Rejouées :                                           |
        | - substanceLogs : [] (Compensé par SUBSTANCE_REMOVED)            |
        | - cravings : [crav-1]                                            |
        | - goals : [goal-1]                                               |
        | - profilePatch : { quitDate: ... }                               |
        +------------------------------------------------------------------+
```

#### Principes Fondamentaux de Durcissement du Journal
1. **Chiffrement au Repos Systématique** : Tous les événements persistés dans `events_store` d'IndexedDB sont chiffrés avec Web Crypto AES-GCM 256 bits. Aucune note sensible ni donnée de prise n'est stockée en texte clair.
2. **Échec Visible (Fail-Visibly)** : `recordJournalEvent()` attend la confirmation de `idbAppendEvent()` et ne masque jamais les erreurs d'écriture ou de chiffrement. Si la persistance échoue, une exception est immédiatement levée.
3. **Statut de Lecture Explicite** : `idbGetAllEventsWithStatus()` distingue sans ambiguïté :
   - `'empty'` : Magasin existant contenant zéro enregistrement.
   - `'success'` : Événements lus et déchiffrés avec succès.
   - `'error'` : Magasin inaccessible ou déchiffrement échoué (fournit l'erreur d'origine ; n'est jamais confondu avec un journal vide).
4. **Continuité de Séquence après Redémarrage** : `restoreJournalSequence()` scanne la séquence `seq` maximale dans `events_store` au démarrage de l'application. Les nouveaux événements continuent de manière strictement monotone (`n+1`, `n+2`) sans jamais régresser à 1 ni provoquer de collisions d'identifiants.
5. **Rejeu Précis des Suppressions Multi-Entités** : `replayJournalEvents()` prend en charge fidèlement les événements d'annulation :
   - `SUBSTANCE_REMOVED` : Décrémente le total des prises correspondantes jusqu'à l'horodatage de l'événement.
   - `STREAK_REMOVED` : Supprime la série annulée par son identifiant.
   - `CRAVING_REMOVED` : Supprime la pulsion annulée par son identifiant.
   - `PURCHASE_EXPENSE_DELETED` : Supprime la dépense par son identifiant.
   - `SAVINGS_GOAL_DELETED` : Supprime l'objectif par son identifiant.

---

### 3.3. Concurrence, Sérialisation & Anti-Troncature (`src/utils/storage.ts`)

#### 1. Le Pipeline FIFO de Promises (`storageQueue`)
Pour éliminer les courses d'écriture lors de clics rapides ou d'appels simultanés, toutes les opérations de lecture-modification-écriture passent par `storageQueue.enqueue()`. Elles s'exécutent dans un ordre FIFO rigoureux.

#### 2. Fusion par Union par Défaut
Lors de l'enregistrement de collections (prises, pulsions, séries, dépenses), la couche de stockage fusionne les éléments entrants avec les enregistrements disque existants à partir de clés primaires dédupliquées (`id`, `timestamp`, `start`).
- **Préservation des Événements Concurrents** : 20 événements indépendants enregistrés dans la même milliseconde survivent tous sans perte.
- **Écrasement Explicite** : Les suppressions intentionnelles transmettent `{ overwrite: true }`, garantissant le respect absolu des choix de l'utilisateur.

#### 3. Protection Stricte Contre les Tableaux Vides (`verifySafeEmptyOverwrite`)
L'écrasement de données par un tableau vide (`[]`) est interdit sauf si :
- L'utilisateur a explicitement demandé une réinitialisation (`{ allowEmptyReset: true }`), **ET**
- Le stockage primaire est réellement absent ou vide, **ET**
- Le stockage historique est réellement absent ou vide, **ET**
- Le snapshot de sauvetage ne contient aucun enregistrement.

> [!CAUTION]
> Si une opération de lecture retourne `status: 'decryption_error'` ou si une erreur d'E/S survient, `verifySafeEmptyOverwrite` lève immédiatement `DecryptionError` ou `Error`. Elle ne traite **jamais** un échec de lecture comme une preuve que les données sont inexistantes.

---

### 3.4. Moteur de Récupération Approfondie (`src/utils/recovery.ts`)

PuffinLess intègre un scanner de récupération local qui reconstruit l'historique utilisateur même si le cache du navigateur a été partiellement vidé, altéré ou corrompu.

#### Protocole de Récupération
1. **Instantané Initial de Référence** : Enregistre les identifiants actifs en mémoire/stockage avant l'analyse.
2. **Exploration Multi-Niveaux** :
   - Niveau 1 : Snapshot de Sauvetage Local (`puffinless_device_rescue_backup_v2`).
   - Niveau 2 : Magasin Clé-Valeur IndexedDB (`puffinless_indexeddb` / `kv_store`).
   - Niveau 3 : Journal d'Événements Chiffré IndexedDB (`events_store`), interrogé avec `idbGetAllEventsWithStatus` et rejoué via `replayJournalEvents`.
   - Niveau 4 : LocalStorage Moderne (`puffinless_*_v2`).
   - Niveau 5 : LocalStorage Historique (`puffinless_profile`, `puffinless_cravings`, etc. en AES-CBC).
3. **Validation Stricte des Champs de Date (`isValidDateField`)** :
   - Rejette les chaînes corrompues, les nombres arbitraires et les dates hors limites.
   - N'accepte que les horodatages ISO-8601 authentifiés situés entre le `2000-01-01` et `maintenant + 24h`.
4. **Rapport Différentiel Honnête** :
   - `hasNewlyRecoveredData` : Passe à `true` **uniquement** si des enregistrements étaient absents de la référence initiale.
   - `newlyRecovered` : Dénombrement exact (`streaks`, `cravings`, `substances`, `expenses`, `goals`, `sleep`, `profileRestored`).
   - `integrity` : Rapporte `totalScanned`, `validRecords`, `corruptedRejected` et `datesVerified`.
   - Si les données étaient déjà intactes, l'interface affiche : *"Toutes vos données sont déjà saines et synchronisées (0 élément manquant)."*

---

### 3.5. Sécurité de l'Application & Verrouillage Anti-Brute-Force (`src/utils/security.ts`)

| Paramètre | Valeur / Mécanisme | Objectif de Sécurité |
|---|---|---|
| **Algorithme de Hachage du PIN** | PBKDF2-HMAC-SHA256 | Étirement cryptographique unidirectionnel à coût élevé |
| **Itérations** | 100 000 itérations | Neutralise les attaques par dictionnaires optimisées GPU/ASIC |
| **Sel (Salt)** | 16 octets cryptographiquement aléatoires | Empêche les tables arc-en-ciel et la corrélation inter-utilisateurs |
| **Verrouillage Progressif** | Temporisation exponentielle : `1s -> 2s -> 4s -> 8s -> ... -> 300s` | Rend impossible les attaques par force brute automatisées |
| **Frontière de Session** | Jeton de validation en `sessionStorage` | Distingue un simple rafraîchissement d'un arrêt complet du navigateur |

---

### 3.6. Moteur de Métriques Cliniques Périodiques (`src/utils/clinicalMetrics.ts`)

Pour éviter les graphiques faussés et les interprétations cliniques erronées :
- **Isolation Temporelle Stricte** : Les métriques calculées pour le Jour (24h), la Semaine (7j), le Mois (30j) et Global appliquent un filtre strict d'horodatage dans l'intervalle `[maintenant - fenêtre, maintenant]`.
- **Garantie Zéro Fuite** : Si zéro pulsion ou écart n'est survenu dans les 24 dernières heures, le rapport indique strictement `0 pulsion` (100% de maîtrise), sans jamais afficher les chiffres globaux par défaut.
- **Exactitude Financière & Doses** : Les économies représentent l'allocation journalière de base diminuée des achats réels enregistrés sur la période sélectionnée.

---

### 3.7. Ergonomie Visuelle & Typographie Blanche du Centre Financier (`src/components/MoneyView.tsx`)

Les métriques financières et cliniques exigent une lisibilité immédiate, à haut contraste, sans fatigue oculaire ni délavage sombre :
- **Typographie Blanche Haute Lisibilité** : Tous les indicateurs analytiques majeurs, titres de cartes, descriptions, analyses en 4 quadrants et projections composées emploient des polices blanches précises (`text-white`, `text-white/95`, `text-white/90`, `text-white/85 font-medium`).
- **Élimination Totale des Textes à Faible Contraste** : Les teintes grises assombries et les textes peu contrastés des 4 quadrants de référence (Perte sur 10 ans, Espérance de vie, Sommeil paradoxal, Charge pulmonaire) ont été remplacés par des tons blancs équilibrés.
- **Clarté des Modales & Formulaires** : Les fenêtres de saisie d'achats et de création d'objectifs appliquent des libellés blancs en gras (`text-white font-semibold`) et des indications limpides.

---

## 4. Pipeline de Compilation, Durcissement & Obfuscation

L'application est compilée en un exécutable autonome inviolable :

```
src/ (TypeScript, React 19, CSS)
  │
  ├──> npx tsc -b                    (Vérification de type stricte, 0 erreur admise)
  ├──> vite build                    (Minification, découpage en chunks, assemblage)
  ├──> scripts/make-standalone.js    (Intégration du CSS, JS, SVG et polices WOFF2 en un seul fichier)
  └──> javascript-obfuscator         (Aplatissement de flux de contrôle, chaînes base64, hachage hexadécimal)
        │
        └──> dist/standalone.html    (Fichier autonome protégé d'environ 2,7 Mo)
              │
              └──> Synchronisé vers : C:\Users\tiegb\Desktop\final version 1\PuffinLess_App.html
```

---

## 5. Banc d'Épreuve & Tests d'Ingénierie Automatisés (52 Tests sur 8 Piliers)

La suite de tests dans [`tests/engineering-verification.test.js`](file:///c:/Users/tiegb/Documents/WEB%20WORK/PuffinLess/tests/engineering-verification.test.js) s'exécute directement sur le code source de production sans simulation artificielle de la cryptographie ou de la file d'attente de stockage :

1. **Pilier 1 : AES-GCM via CryptoKey Non Extractible & Coffre IndexedDB** (6 tests)
2. **Pilier 2 : Hachage de PIN PBKDF2 (100k iter) & Effacement Total** (2 tests)
3. **Pilier 3 : Métriques Périodiques (Exécution Réelle des Fonctions de Production)** (4 tests)
4. **Pilier 4 : Sécurité de Session, Intégration PBKDF2 & Redémarrage** (4 tests)
5. **Pilier 5 : Persistance Réelle IndexedDB, Migration & Zéro Perte** (10 tests)
6. **Pilier 6 : Redémarrages Navigateur Réels & Cycle de Vie du Stockage** (4 tests)
7. **Pilier 7 : Garanties Anti-Perte, Journal d'Événements & Concurrence** (22 tests)
   - Chiffrement systématique au repos des événements avec AES-GCM dans `events_store`.
   - Propagation d'erreur Fail-Visibly lors des échecs d'écriture au journal.
   - Distinction explicite des statuts de lecture `'empty' | 'success' | 'error'`.
   - Rejeu fidèle des suppressions (`SUBSTANCE_REMOVED`, `STREAK_REMOVED`, `CRAVING_REMOVED`).
   - Restauration des séquences monotones après redémarrage à froid simulé.
   - Survie sans perte de 20 enregistrements concurrents simultanés.

---

## 6. Arborescence du Dépôt & Structure du Code

```
PuffinLess/
├── docs/                                           # Architecture, audits de sécurité & revues
│   ├── ENGINEERING_ARCHITECTURE.md                 # Notes de sécurité technique
│   ├── SYSTEM_STRUCTURE_AND_CHARACTERISTICS_EN.md   # Manuel d'Architecture Système (Anglais)
│   ├── STRUCTURE_SYSTEME_ET_CARACTERISTIQUES_FR.md # Manuel d'Architecture Système (Français)
│   └── PuffinLess_Persistent_Memory_Storage_Review_2026-11-08.pdf
├── src/
│   ├── components/                                 # Couche présentation utilisateur
│   │   ├── MoneyView.tsx                           # Centre Financier en typographie blanche haute lisibilité
│   │   ├── ProfileModal.tsx                        # Modale profil, export JSON et récupération honnête
│   │   ├── SosModal.tsx                            # Protocole d'urgence pulsion 180 secondes
│   │   ├── ClinicalCertificateModal.tsx           # Synthèse médicale périodique
│   │   └── ...
│   ├── core/
│   │   └── obsidianCore.ts                         # Indicateurs cliniques, calculs et citations
│   ├── state/
│   │   └── useAppStore.ts                          # Store central avec restauration de séquence et journal
│   ├── types/
│   │   └── index.ts                                # Types TypeScript, schéma des événements du journal
│   └── utils/
│       ├── crypto.ts                               # Web Crypto AES-GCM, coffre de clés, déchiquetage
│       ├── indexedDb.ts                            # Pilote events_store chiffré et kv_store
│       ├── journal.ts                              # Journal en ajout seul & moteur de rejeu des projections
│       ├── recovery.ts                             # Moteur de récupération multi-niveaux
│       ├── storage.ts                              # File FIFO, fusion par union, protection anti-vide
│       ├── security.ts                             # Hachage de PIN PBKDF2 & temporisation exponentielle
│       ├── clinicalMetrics.ts                      # Calculs périodiques étanches
│       └── dates.ts                                # Formatage et parsing de dates sécurisés
├── tests/
│   └── engineering-verification.test.js            # 52 tests d'ingénierie rigoureux (100% au vert)
└── scripts/
    └── make-standalone.js                          # Pipeline d'assemblage et d'obfuscation JavaScript
```

---

## 7. Directive Opérationnelle pour les Futures Revues & Mises à Jour

À partir de cette version, toutes les revues d'ingénierie, audits de sécurité, évaluations cryptographiques et évolutions structurelles majeures doivent être systématiquement exportés et versionnés dans le dossier `docs/` du dépôt PuffinLess. Cette exigence garantit la maintenabilité à long terme, la traçabilité complète et l'auditabilité historique du système.
