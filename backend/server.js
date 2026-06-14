const express = require('express');
const cors = require('cors');
const { pool, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDB();

// ============ ROUTES API ============

// COURS
app.get('/api/courses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM courses ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/courses', async (req, res) => {
    try {
        const { titre, description, formateur, niveau, categorie, statut, duree, inscrits, progression, modules } = req.body;
        const result = await pool.query(
            `INSERT INTO courses (titre, description, formateur, niveau, categorie, statut, duree, inscrits, progression, modules) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [titre, description, formateur, niveau, categorie, statut || 'actif', duree, inscrits || 0, progression || 0, modules || 1]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// APPRENANTS
app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        const { nom, email, groupe, statut, avatar } = req.body;
        const result = await pool.query(
            `INSERT INTO students (nom, email, groupe, statut, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nom, email, groupe, statut || 'actif', avatar || '']
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/students/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// INSCRIPTIONS
app.get('/api/enrollments', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.*, s.nom as student_name, c.titre as course_title 
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN courses c ON e.course_id = c.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/enrollments', async (req, res) => {
    try {
        const { student_id, course_id, progression, score, statut, certificat } = req.body;
        const result = await pool.query(
            `INSERT INTO enrollments (student_id, course_id, progression, score, statut, certificat) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             ON CONFLICT (student_id, course_id) DO NOTHING 
             RETURNING *`,
            [student_id, course_id, progression || 0, score || 0, statut || 'en_cours', certificat || false]
        );
        res.json(result.rows[0] || { message: 'Déjà inscrit' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// QUIZ
app.get('/api/quizzes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM quizzes ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/quiz-results', async (req, res) => {
    try {
        const { quiz_id, student_id, score, reponses } = req.body;
        const result = await pool.query(
            `INSERT INTO quiz_results (quiz_id, student_id, score, reponses) VALUES ($1, $2, $3, $4) RETURNING *`,
            [quiz_id, student_id, score, JSON.stringify(reponses || [])]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ANNONCES
app.get('/api/announcements', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM announcements ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/announcements', async (req, res) => {
    try {
        const { titre, contenu, priorite, auteur, course_id } = req.body;
        const result = await pool.query(
            `INSERT INTO announcements (titre, contenu, priorite, auteur, course_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [titre, contenu, priorite || 'normal', auteur || 'Admin', course_id || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API EduTrack démarrée sur le port ${PORT}`);
});
