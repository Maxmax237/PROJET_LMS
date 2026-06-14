# 🎓 EduTrack LMS — Plateforme de Gestion de l'Apprentissage

## 📋 Description
EduTrack est un **LMS (Learning Management System)** complet, développé en HTML, CSS et JavaScript pur. Il est entièrement hébergeable et conçu pour un **suivi pédagogique rigoureux**.

---

## ✅ Fonctionnalités implémentées

### 🏠 Tableau de bord
- KPIs en temps réel : apprenants actifs, cours actifs, taux de complétion, certificats émis
- Graphique **barres** : progression moyenne par cours (Chart.js)
- Graphique **donut** : répartition des statuts d'inscription
- Fil d'activité récente
- Aperçu des annonces récentes

### 📚 Gestion des Cours
- Liste des cours sous forme de cartes visuelles avec miniatures
- **Filtres** : statut, niveau, catégorie
- **Recherche** globale
- Création / modification / suppression de cours
- Indicateurs : formateur, durée, nombre d'inscrits, modules, progression moyenne

### 👥 Gestion des Apprenants
- Tableau des apprenants avec avatar, email, groupe
- **Filtres** : groupe, statut
- Création / modification / suppression d'apprenants
- Inscription à plusieurs cours via cases à cocher
- **Profil détaillé** : progression par cours, scores, certificats

### 📊 Suivi Pédagogique
- Vue consolidée de toutes les inscriptions
- **Filtres** : cours, apprenant, statut
- Barres de progression visuelles par couleur (vert/orange/violet)
- Scores avec code couleur (vert ≥80, orange ≥60, rouge <60)
- Indicateurs de certificats émis
- **Export CSV** du suivi pédagogique complet

### 🧪 Quiz & Évaluations
- Liste des quiz avec informations complètes
- **Passation de quiz** interactive avec :
  - Timer en temps réel
  - Soumission automatique à la fin du temps
  - Correction instantanée (surlignage vert/rouge)
  - Score final avec mention réussi/non réussi
- Création / modification de quiz avec éditeur de questions
- Enregistrement des résultats en base

### 📢 Annonces
- Publication d'annonces avec 3 niveaux de priorité (Normal / Important / Urgent)
- **Filtres** par priorité
- Association d'une annonce à un cours spécifique
- Création / modification / suppression

---

## 🗂️ Structure des fichiers

```
index.html          → Page principale (SPA mono-page)
css/
  style.css         → Tous les styles (responsive, composants, animations)
js/
  app.js            → Logique complète (navigation, API, rendu, formulaires)
README.md
```

---

## 🗄️ Modèles de données (Tables API)

| Table | Description |
|---|---|
| `courses` | Cours (titre, description, formateur, niveau, statut...) |
| `students` | Apprenants (nom, email, groupe, cours inscrits...) |
| `modules` | Modules des cours (titre, type, durée, contenu) |
| `enrollments` | Inscriptions (progression, score, statut, certificat) |
| `quizzes` | Quiz (questions JSON, score min, durée, tentatives) |
| `quiz_results` | Résultats de quiz (score, réponses, temps passé) |
| `announcements` | Annonces (priorité, auteur, cours concerné) |

---

## 🔗 Points d'entrée

| URL | Description |
|---|---|
| `/` | Dashboard (page d'accueil) |
| `#dashboard` | Tableau de bord |
| `#courses` | Liste et gestion des cours |
| `#students` | Liste et gestion des apprenants |
| `#progress` | Suivi pédagogique |
| `#quizzes` | Quiz et évaluations |
| `#announcements` | Annonces |

---

## 🚀 Déploiement
Utilisez l'onglet **Publish** pour déployer le site en ligne en un clic.

---

## 🔮 Évolutions recommandées

- [ ] Module de **messagerie** entre formateur et apprenants
- [ ] **Calendrier** de sessions et événements pédagogiques
- [ ] **Badges gamification** et système de points
- [ ] Profil apprenant avec historique complet
- [ ] Module de **présence** (émargement numérique)
- [ ] **Rapport PDF** de suivi individuel par apprenant
- [ ] Import CSV d'apprenants en masse
- [ ] Module de **ressources** (documents, vidéos, liens)

---

## 🛠️ Technologies
- **HTML5** sémantique
- **CSS3** custom (variables, flexbox, grid, animations)
- **JavaScript ES6+** vanilla (SPA sans framework)
- **Chart.js** via CDN pour les graphiques
- **Font Awesome 6** pour les icônes
- **API REST** Tables Genspark pour la persistance
