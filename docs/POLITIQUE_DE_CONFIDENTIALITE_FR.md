# Politique de Confidentialité & Gestion des Données — PuffinLess 🛡️

**Date d'entrée en vigueur :** 16 novembre 2026  
**Dernière mise à jour :** 16 novembre 2026  
**Application :** PuffinLess (Éditions Web, PWA et Autonome Hors-Ligne)  
**Site officiel :** `https://puffinless.app`

---

## 1. Identité de l'Éditeur & Gouvernance des Données

**Éditeur du service :**  
PuffinLess Software (« l'Éditeur », « nous »)  
Courriel de contact : `privacy@puffinless.app` • `contact@puffinless.app`  
Délégué / Responsable de la protection des données : PuffinLess Privacy & Security Governance  
Adresse administrative : PuffinLess Software, Service Juridique, 75008 Paris, France

---

## 2. Architecture de Confidentialité : Stockage Local Intégral

PuffinLess est conçu selon le principe de **minimisation absolue des données et de souveraineté individuelle** :

### 2.1 Données Conservées sur Votre Appareil
L'ensemble de vos données d'accompagnement à l'arrêt, incluant :
- La date et l'heure exacte de début de votre abstinence ;
- Le décompte quotidien des cigarettes, bouffées de vape ou joints consommés ;
- Les déclencheurs contextuels enregistrés (Stress, Fin de repas, Soirée, Alcool, Ennui) ;
- Les envies surmontées et les scores de maîtrise comportementale ;
- Les évaluations quotidiennes de sommeil (1 à 10) et de niveau d'énergie (1 à 10) ;
- Le suivi des économies financières et des objectifs de récompense ;
- Le code PIN d'accès local (haché localement) ;

**sont enregistrées directement et exclusivement dans la mémoire locale de votre appareil.**

### 2.2 Absence Totale de Base de Données Cloud Centrale
L'Éditeur n'exploite **AUCUNE** base de données distante hébergeant vos historiques personnels. Vos journaux de consommation ne sont jamais envoyés, synchronisés ni sauvegardés sur des serveurs externes.

---

## 3. Infrastructure d'Hébergement Web & Métadonnées Réseau

Si vos journaux d'habitudes restent strictement locaux, l'accès au site PuffinLess via le réseau Internet implique l'échange de métadonnées techniques standard :

### 3.1 Fournisseurs d'Hébergement Web
Les fichiers statiques de l'Application (pages HTML, feuilles de style, scripts, polices locales et icônes) sont hébergés et distribués via des prestataires d'infrastructure reconnus :
- **Vercel Inc.**  
  440 N Barranca Ave #4133, Covina, CA 91723, États-Unis  
  Politique de confidentialité : `https://vercel.com/legal/privacy-policy`
- **GitHub Pages (GitHub, Inc. / Microsoft Corporation)**  
  88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis  
  Politique de confidentialité : `https://docs.github.com/en/site-policy/privacy-policies`

### 3.2 Métadonnées Techniques de Connexion
Lors du chargement des fichiers de l'Application par votre navigateur, les serveurs d'hébergement enregistrent de manière temporaire les métadonnées de connexion réseau indispensables à la sécurité et à l'acheminement des flux :
- Adresse IP publique de votre connexion ;
- Date et heure de la requête HTTP/HTTPS ;
- Ressource ou fichier demandé (ex : `/index.html`, `/favicon.svg`) ;
- Code de statut HTTP et volume de données transféré ;
- Type de navigateur, système d'exploitation et agent utilisateur (User-Agent).

**Finalité & Base Légale :** Ces métadonnées réseau sont traitées sur le fondement de l'intérêt légitime (RGPD, article 6 § 1 f) aux seules fins d'assurer la sécurité du réseau, de prévenir les attaques par déni de service (DDoS) et de distribuer les contenus. Ces journaux d'infrastructure ne sont jamais croisés avec des données de consommation.

---

## 4. Zéro Compte, Zéro Traceur Publicitaire, Zéro Vente de Données

- **Aucun Compte Utilisateur :** Vous n'avez pas besoin de fournir d'adresse e-mail, de numéro de téléphone ni de mot de passe pour utiliser PuffinLess.
- **Zéro Pixel Publicitaire :** PuffinLess n'embarque aucun traceur publicitaire, ni Google Analytics, ni Pixel Meta/Facebook, ni outil de ciblage marketing tiers.
- **Aucune Vente de Données :** Nous ne commercialisons, ne louons et ne transmettons aucune donnée personnelle à des courtiers en données, assureurs, employeurs ou régies publicitaires.
- **Paiements Sécurisés :** En cas d'achat d'une licence sur notre site, vos coordonnées bancaires sont collectées et traitées directement par notre prestataire de paiement certifié PCI-DSS (Stripe / Gumroad). L'Éditeur ne conserve jamais votre numéro de carte bancaire.

---

## 5. Droits des Personnes, Portabilité & Suppression Immédiate

Conformément au Règlement Général sur la Protection des Données (RGPD, articles 15, 17 et 20) :

### 5.1 Droit à la Portabilité des Données (Article 20 du RGPD)
Vous pouvez exporter une copie complète et lisible de l'ensemble de vos données à tout moment :
1. Accédez aux **Paramètres** (icône Profil).
2. Rendez-vous dans la section **Sauvegarde & Gestion des Données**.
3. Cliquez sur **Exporter la Sauvegarde (.json)**.  
Un fichier `.json` standard contenant l'intégralité de votre historique est immédiatement téléchargé sur votre appareil.

### 5.2 Droit à l'Effacement / Suppression Immédiate (Article 17 du RGPD)
Vous pouvez supprimer immédiatement toutes vos données locales :
1. Rendez-vous dans **Paramètres** -> **Réinitialisation Locale & Suppression des Données**.
2. Cliquez sur **Supprimer Toutes Mes Données** et confirmez.
3. L'Application efface instantanément la base locale, l'historique et la session active sur ce navigateur.

> **Précision importante sur la portée de l'effacement :** Cette suppression n'affecte pas les fichiers d'export (.json) que vous avez déjà enregistrés sur votre ordinateur ou disque dur externe, ni les sessions ouvertes sur d'autres navigateurs ou appareils.

---

## 6. Avertissement Médical & Santé

PuffinLess est un outil d'accompagnement personnel et d'auto-mesure des habitudes. Il ne constitue pas un dispositif médical et ne fournit aucun avis médical, diagnostic clinique ni prescription de sevrage. En cas de détresse de santé ou de symptômes de sevrage intenses, contactez sans attendre un professionnel de santé ou les services d'urgence (15 en France, 112 en Europe).

---

## 7. Contact de l'Éditeur

Pour toute question relative à la protection de vos données personnelles :  
📧 **`privacy@puffinless.app`**  
PuffinLess Software, Service Juridique & Protection des Données  
Site web : `https://puffinless.app`
