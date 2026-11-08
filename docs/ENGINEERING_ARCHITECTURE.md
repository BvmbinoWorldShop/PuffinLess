# PuffinLess — Architecture Technique, Sécurité & Spécifications Cryptographiques

Ce document décrit l'implémentation technique des normes de sécurité, de confidentialité et d'ingénierie intégrées dans **PuffinLess**.

---

## 1. Chiffrement Authentifié AES-GCM (Web Crypto API)

### Contexte & Haute Sécurité
PuffinLess utilise l'API native standard **Web Crypto API** (`crypto.subtle`) pour chiffrer l'ensemble des données sensibles au repos dans **IndexedDB** (`puffinless_indexeddb`) et en stockage local (`localStorage`).

### Spécifications Cryptographiques
- **Algorithme** : AES-GCM (Galois/Counter Mode) avec clé de 256 bits et tag d'authentification de 128 bits.
- **Vecteur d'Initialisation (IV) Unique** : Chaque opération de chiffrement génère dynamiquement un IV aléatoire de 96 bits (12 octets) via `crypto.getRandomValues(new Uint8Array(12))`. Deux sauvegardes d'un même état produisent toujours des ciphertexts complètement distincts.
- **Gestion Explicite des Clés** : Une clé de coffre de 256 bits (`puffinless_vault_key_v2`) est générée via un PRNG cryptographique certifié et importée via `crypto.subtle.importKey`.
- **Suppression du Fallback Déterministe** : Aucun sel codé en dur ni clé dérivée de secours n'est utilisé pour les nouveaux chiffrements. En cas d'indisponibilité du PRNG, l'opération est bloquée (fail-closed) pour empêcher toute fuite en clair ou chiffrement prévisible.
- **Format du Payload** : `aes-gcm:<ivHex>:<ciphertextBase64>`.
- **Migration sans perte des anciennes données (AES-CBC)** : Le moteur de déchiffrement inspecte le préfixe. Tout enregistrement historique au format `aes256:<ciphertext>` (CryptoJS AES-CBC) est automatiquement déchiffré sans perte, puis ré-enregistré en AES-GCM lors de la prochaine écriture.

---

## 2. Suppression Complète des Données & Cryptoshredding (P0)

Pour respecter le droit à l'effacement définitif (RGPD Art. 17) :

1. **Destruction Physique de la Base IndexedDB** :
   - Fermeture immédiate de toutes les connexions actives (`dbInstance.close()`).
   - Appel à `window.indexedDB.deleteDatabase('puffinless_indexeddb')`.
2. **Cryptoshredding (Destruction des Clés)** :
   - Suppression irrévocable de `puffinless_vault_key_v2` et `puffinless_vault_key_v1` via `purgeVaultKeys()`.
   - Réinitialisation du cache en mémoire `cachedCryptoKey = null`.
   - Même si un secteur de disque rémanent persistait, les données sont mathématiquement indéchiffrables.
3. **Purge Intégrale du Stockage Navigateur** :
   - Purge complète `localStorage.clear()` et `sessionStorage.clear()`.
   - Suppression du hash salé du code PIN et des historiques de lockout (`purgeSecurityState()`).
4. **Réinitialisation de l'État Mémoire** :
   - Remise à zéro du store vers l'état non-embarqué (`isOnboarded: false`), renvoyant immédiatement vers l'onboarding.

---

## 3. Statistiques Strictement Périodiques & Fin des Données Hors Période (P1)

Le certificat clinique et le journal de bord filtrent rigoureusement les données en fonction de la fenêtre temporelle active (`day` = 24h, `week` = 7j, `month` = 30j) :

- **Durée Sobre Périodique** : Plafonnée à la durée exacte de la fenêtre (`periodCleanDays`, `periodCleanHours`).
- **Économies sur la Période** : Calculées à partir des dépenses quotidiennes attendues sur la fenêtre moins les achats réels déclarés sur cette même fenêtre (`totalExpensesAmount`).
- **Doses Évitées sur la Période** : Doses théoriques attendues pour la fenêtre moins les prises réelles enregistrées sur la période.
- **Zéro Fuite Hors Période pour les Pulsions & Sommeil** :
  - Si aucune pulsion n'a eu lieu sur les dernières 24 heures, le rapport indique rigoureusement `0 pulsion` (100% de maîtrise), sans jamais substituer silencieusement les pulsions de l'historique global.
  - De même, les moyennes de sommeil et d'énergie ne prennent en compte que les nuits de la période sélectionnée.

---

## 4. Élimination des Affirmations Prédictives Non-Fondées (P1)

- Remplacement des termes prédictifs présomptueux ("pic dopaminergique garanti", "le pic de pulsion s'effondre") par des descriptions observationnelles et comportementales rigoureuses :
  - *« Anticiper la fenêtre de pulsion habituelle 15 minutes avant le pic observé dans vos relevés. »*
  - *« Protocole comportemental des 180 secondes : temporiser avec un verre d'eau fraîche, l'intensité de la pulsion décroît naturellement. »*
- Étiquetage transparent du radar de déclencheurs en **Tendance Observée** (plutôt que prédiction déterministe).

---

## 5. Accessibilité & Standards WCAG (P2)

- **Modales & Dialogues Accessibles** : Toutes les modales (`ProfileModal`, `SosModal`, `OnboardingModal`, `ClinicalCertificateModal`) intègrent `role="dialog"`, `aria-modal="true"` et `aria-labelledby`.
- **Navigation & Boutons** :
  - Attributs `aria-label` descriptifs sur chaque bouton d'action et icône sans texte visible.
  - La barre de navigation principale utilise `role="tablist"` et `aria-selected` dynamique.
- **Focus & Contraste** : Boutons avec outline net et gestion des contrastes texte/fond sur les thèmes sombre et clair.

---

## 6. Banc de Tests Automatisés Connecté au Code Réel (P1)

La suite de tests automatisés native Node.js (`node --test`) teste directement les modules de production sans duplication de code :

```bash
# Lancement de la suite de tests
npm test
```

### Tests Couverts (`tests/engineering-verification.test.js`) :
1. **Chiffrement AES-GCM (Web Crypto API)** :
   - Vérification du préfixe `aes-gcm:`.
   - Vérification de l'unicité de l'IV (deux chiffrements consécutifs d'une même donnée produisent des IVs et des ciphertexts différents).
   - Vérification de l'absence totale de texte en clair dans le payload chiffré.
   - Déchiffrement avec 100% de fidélité.
2. **Migration AES-CBC (CryptoJS)** :
   - Déchiffrement réussi des charges utiles historiques `aes256:...`.
3. **Cryptoshredding & Purge Totale** :
   - Vérification du vidage intégral de `localStorage` et `sessionStorage` (0 clé restante).
   - Impossibilité mathématique de déchiffrer les anciens payloads avec une nouvelle clé.
4. **Calculs Périodiques Étanches** :
   - Validation du filtrage strict des pulsions sur 24h sans contamination de l'historique global.
   - Validation du calcul des économies et doses évitées calibrées à la fenêtre temporelle.

---
*PuffinLess — Privacy-First Offline Architecture — 100% On-Device.*
