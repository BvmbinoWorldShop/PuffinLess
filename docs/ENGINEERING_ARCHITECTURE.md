# PuffinLess — Architecture Technique & Sécurité des Données

Ce document décrit l'implémentation technique des 5 piliers d'ingénierie et de sécurité intégrés dans **PuffinLess**.

---

## 1. Chiffrement Réel AES-256 au Repos pour IndexedDB

### Contexte & Problématique
Le stockage standard des navigateurs (`localStorage`) est plafonné à 5 Mo et sujet à l'éviction par les systèmes d'exploitation mobiles (iOS WebKit / Android WebView). 
Pour permettre un stockage multi-gigaoctets fiable et asynchrone sans bloquer l'UI, PuffinLess utilise **IndexedDB** (`puffinless_indexeddb`, store `kv_store`).

### Architecture de Chiffrement
- **Clé de Coffre Locale (Device Vault Key)** : Une clé cryptographique de 256 bits (`puffinless_vault_key_v2`) est générée localement sur l'appareil de l'utilisateur via `crypto.getRandomValues(new Uint8Array(32))` lors du premier lancement.
- **Zéro Plaintext au Repos** : Avant d'être écrit dans IndexedDB (`idbSet`), tout objet JavaScript (profil, historique des pulsions, relevés de substances, dépenses, sommeil) est sérialisé en JSON puis chiffré avec **AES-256-CBC**.
- **Format du Payload** : Chaque valeur stockée dans IndexedDB est préfixée par `aes256:U2FsdGVkX1...`. L'inspection via les DevTools du navigateur (`Application > IndexedDB > kv_store`) ne révèle aucun texte en clair.
- **Lecture Asynchrone Déchiffrée** : `idbGet<T>` extrait le ciphertext et le déchiffre à la volée. Un fallback transparent gère les objets hérités pré-chiffrement pour assurer une transition sans rupture.

---

## 2. Suppression Complète des Données & Cryptoshredding

### Procédure d'Effacement Définitive (`resetAllUserData`)
Pour respecter rigoureusement l'Article 17 du RGPD (Droit à l'effacement) et garantir une suppression irréversible :

1. **Suppression Physique de la Base IndexedDB** :
   - Fermeture immédiate des connexions actives (`dbInstance.close()`).
   - Appel à `window.indexedDB.deleteDatabase('puffinless_indexeddb')` pour supprimer le fichier physique du disque.
2. **Cryptoshredding (Destruction des Clés de Chiffrement)** :
   - Suppression irrévocable de `puffinless_vault_key_v2` et `puffinless_vault_key_v1` via `purgeVaultKeys()`.
   - Même si un secteur de disque ou une copie de sauvegarde temporaire du navigateur persistait, les données sont mathématiquement impossibles à déchiffrer.
3. **Purge des Identifiants & États de Sécurité** :
   - Suppression du hash salé du code PIN (`pinHash`), du sel cryptographique (`pinSalt`) et des historiques de lockout anti-brute force via `purgeSecurityState()`.
4. **Sanitisation des Storages Navigateur** :
   - Balayage et suppression de toutes les clés commençant par `puffinless` dans `localStorage` et `sessionStorage`.
5. **Réinitialisation de l'État Mémoire** :
   - Réinitialisation du store applicatif vers l'état non-embarqué (`isOnboarded: false`), redirigeant instantanément l'utilisateur vers l'onboarding neuf.

---

## 3. Remplacement des Faux Indicateurs par des Données Utilisateur Réelles

### Élimination des Métriques Simulées
Les jauges physiologiques théoriques non-mesurables directement par une application web (estimations de CO sanguin, repousse des cils bronchiques en pourcentage, sensibilité estimée des récepteurs de dopamine) ont été supprimées du certificat clinique et des tableaux de bord.

### Métriques Comportementales Réelles & Conseils Prédictifs
Elles sont remplacées par 4 indicateurs empiriques calculés exclusivement à partir des déclarations saisies par l'utilisateur :

1. **Taux de Maîtrise des Pulsions (`cravingMasteryPct`)** :
   - Formule : `Math.round((resistedCount / totalCravings) * 100)%`.
   - Calculé directement à partir des pulsions déclarées (surmontées vs subies). Si aucune pulsion ni consommation n'a eu lieu, affiche 100% (abstinence parfaite).
2. **Régularité du Suivi (`loggingConsistencyPct`)** :
   - Formule : Ratio des jours uniques ayant fait l'objet d'une saisie (sommeil, pulsion ou bilan) sur la période choisie (7 ou 30 jours).
3. **Score Moyen de Sommeil Déclaré (`sleepScorePct`)** :
   - Score moyen sur 10 saisi chaque soir/matin par l'utilisateur dans le journal de sommeil.
4. **Indice d'Énergie & Vitalité Ressentie (`energyScorePct`)** :
   - Niveau d'énergie subjectif moyen (1 à 10) déclaré par l'utilisateur.

### Stratégies d'Anticipation Personnalisées
À partir de ces données réelles, le moteur prédictif :
- Détecte les fenêtres horaires à haut risque (ex: 08h-09h post-café, 14h-15h post-repas, 19h-21h détente/stress).
- Associe des protocoles d'action clinique concrets (respiration 4-7-8, règle empirique des 180 secondes, marche sensorielle, hydratation glacée).

---

## 4. Fiabilisation des Événements de Craving

1. **Consistance du Schéma** : Chaque pulsion (`CravingEntry`) possède un identifiant cryptographique (`generateSecureId`), un timestamp ISO 8601 vérifié, une intensité bornée entre 1 et 10, un déclencheur nettoyé (`trigger`), et un indicateur booléen d'issue (`resisted: true | false`).
2. **Double Écriture Synchronisée des Rechutes** : Tout enregistrement de consommation via `logSubstance` crée automatiquement un événement de craving non-surmonté (`resisted: false`) pour garantir une corrélation parfaite entre prises et pulsions subies.
3. **Dédoublonnage Temporel** : Lors de l'analyse comportementale (`CravingPredictionCard`), tout relevé de substance et pulsion survenus dans un intervalle inférieur à 60 secondes est fusionné en un seul épisode unifié.
4. **Annulation Sécurisée (`removeSubstance`)** : Si une saisie accidentelle de substance est annulée par l'utilisateur, l'événement de pulsion non-surmontée correspondant est immédiatement supprimé pour éviter tout biais statistique.

---

## 5. Tests Automatisés & Intégrité Continue

Le projet intègre un banc de tests automatisés natifs exécutables sans dépendance externe lourde :

```bash
# Exécution de la suite de tests de conformité
npm test
```

### Couverture des Tests (`tests/engineering-verification.test.js`) :
- **Test 1** : Chiffrement AES-256 avec préfixe `aes256:`, vérification de l'absence de fuite en clair de noms, montants ou déclencheurs.
- **Test 2** : Déchiffrement sans perte et tolérance aux formats hérités.
- **Test 3** : Cryptoshredding — destruction des clés de coffre et impossibilité mathématique de déchiffrer les payloads précédents avec une nouvelle clé.
- **Test 4** : Calcul rigoureux du taux de résistance aux pulsions et du taux de suivi.
- **Test 5** : Dédoublonnage d'épisodes de pulsion simultanés (fenêtre de 60s).

---
*PuffinLess — Privacy-First Offline Architecture — 100% On-Device.*
