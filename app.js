// ============================================
// EDUTRACK LMS - Version localStorage (Sans API)
// ============================================

// ---------- DONNÉES INITIALES (DÉMO) ----------
let courses = [
    { id: 1, titre: "HTML & CSS", description: "Maîtrisez les bases du web", formateur: "Maxime", niveau: "Débutant", categorie: "Frontend", statut: "actif", duree: "20h", inscrits: 15, progression: 75, modules: 8 },
    { id: 2, titre: "JavaScript", description: "Devenez expert en JS", formateur: "Sophie", niveau: "Intermédiaire", categorie: "Frontend", statut: "actif", duree: "35h", inscrits: 12, progression: 45, modules: 12 },
    { id: 3, titre: "React", description: "Créez des apps modernes", formateur: "Alex", niveau: "Avancé", categorie: "Frontend", statut: "actif", duree: "40h", inscrits: 8, progression: 20, modules: 10 },
    { id: 4, titre: "Python", description: "Programmation polyvalente", formateur: "Julie", niveau: "Débutant", categorie: "Backend", statut: "inactif", duree: "25h", inscrits: 10, progression: 60, modules: 9 }
];

let students = [
    { id: 1, nom: "Alice Martin", email: "alice@email.com", groupe: "G1", statut: "actif", avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
    { id: 2, nom: "Bob Durand", email: "bob@email.com", groupe: "G1", statut: "actif", avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
    { id: 3, nom: "Claire Petit", email: "claire@email.com", groupe: "G2", statut: "actif", avatar: "https://randomuser.me/api/portraits/women/3.jpg" },
    { id: 4, nom: "David Leroy", email: "david@email.com", groupe: "G2", statut: "inactif", avatar: "https://randomuser.me/api/portraits/men/4.jpg" }
];

let enrollments = [
    { id: 1, studentId: 1, courseId: 1, progression: 80, score: 85, statut: "en_cours", certificat: false },
    { id: 2, studentId: 1, courseId: 2, progression: 45, score: 62, statut: "en_cours", certificat: false },
    { id: 3, studentId: 2, courseId: 1, progression: 90, score: 92, statut: "termine", certificat: true },
    { id: 4, studentId: 3, courseId: 2, progression: 30, score: 48, statut: "en_cours", certificat: false }
];

let quizzes = [
    { id: 1, titre: "Quiz HTML/CSS", courseId: 1, questions: [
        { question: "Que signifie CSS ?", options: ["Computer Style Sheets", "Creative Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets"], reponse: 2 },
        { question: "HTML est un langage de ?", options: ["Programmation", "Balises", "Scripting", "Requête"], reponse: 1 }
    ], duree: 5, scoreMin: 50 },
    { id: 2, titre: "Quiz JavaScript", courseId: 2, questions: [
        { question: "Comment déclare-t-on une variable en JS ?", options: ["var", "let", "const", "Toutes ces réponses"], reponse: 3 }
    ], duree: 3, scoreMin: 60 }
];

let quizResults = [];
let announcements = [
    { id: 1, titre: "Bienvenue sur EduTrack !", contenu: "La plateforme est opérationnelle.", priorite: "normal", auteur: "Admin", coursId: null, date: new Date().toISOString() }
];

// ---------- CHARGEMENT LOCALSTORAGE ----------
function loadData() {
    if (localStorage.getItem("courses")) courses = JSON.parse(localStorage.getItem("courses"));
    if (localStorage.getItem("students")) students = JSON.parse(localStorage.getItem("students"));
    if (localStorage.getItem("enrollments")) enrollments = JSON.parse(localStorage.getItem("enrollments"));
    if (localStorage.getItem("quizzes")) quizzes = JSON.parse(localStorage.getItem("quizzes"));
    if (localStorage.getItem("quizResults")) quizResults = JSON.parse(localStorage.getItem("quizResults"));
    if (localStorage.getItem("announcements")) announcements = JSON.parse(localStorage.getItem("announcements"));
    sauvegarderTout();
}

function sauvegarderTout() {
    localStorage.setItem("courses", JSON.stringify(courses));
    localStorage.setItem("students", JSON.stringify(students));
    localStorage.setItem("enrollments", JSON.stringify(enrollments));
    localStorage.setItem("quizzes", JSON.stringify(quizzes));
    localStorage.setItem("quizResults", JSON.stringify(quizResults));
    localStorage.setItem("announcements", JSON.stringify(announcements));
}

// ---------- FONCTIONS MÉTIER ----------
function getCourses() { return courses; }
function getStudents() { return students; }
function getEnrollments() { return enrollments; }
function getQuizzes() { return quizzes; }
function getAnnouncements() { return announcements; }

function ajouterCours(cours) {
    cours.id = courses.length + 1;
    courses.push(cours);
    sauvegarderTout();
    return cours;
}

function supprimerCours(id) {
    courses = courses.filter(c => c.id !== id);
    sauvegarderTout();
}

function ajouterEtudiant(etudiant) {
    etudiant.id = students.length + 1;
    students.push(etudiant);
    sauvegarderTout();
}

function supprimerEtudiant(id) {
    students = students.filter(s => s.id !== id);
    sauvegarderTout();
}

function inscrireApprenant(studentId, courseId) {
    const dejaInscrit = enrollments.some(e => e.studentId === studentId && e.courseId === courseId);
    if (!dejaInscrit) {
        enrollments.push({
            id: enrollments.length + 1,
            studentId, courseId,
            progression: 0, score: 0,
            statut: "en_cours", certificat: false
        });
        sauvegarderTout();
        return true;
    }
    return false;
}

function enregistrerResultatQuiz(quizId, studentId, score, reponses) {
    const resultat = {
        id: quizResults.length + 1,
        quizId, studentId, score, reponses,
        date: new Date().toISOString()
    };
    quizResults.push(resultat);
    sauvegarderTout();
    return resultat;
}

function ajouterAnnonce(annonce) {
    annonce.id = announcements.length + 1;
    annonce.date = new Date().toISOString();
    announcements.push(annonce);
    sauvegarderTout();
}

// ---------- INITIALISATION ----------
loadData();

// Exposition des fonctions pour le HTML (si appelées depuis les clics)
window.ajouterCours = ajouterCours;
window.supprimerCours = supprimerCours;
window.ajouterEtudiant = ajouterEtudiant;
window.supprimerEtudiant = supprimerEtudiant;
window.inscrireApprenant = inscrireApprenant;
window.enregistrerResultatQuiz = enregistrerResultatQuiz;
window.ajouterAnnonce = ajouterAnnonce;
window.getCourses = getCourses;
window.getStudents = getStudents;
window.getEnrollments = getEnrollments;
window.getQuizzes = getQuizzes;
window.getAnnouncements = getAnnouncements;

console.log("✅ EduTrack chargé avec localStorage ! Données disponibles :", { courses, students });
