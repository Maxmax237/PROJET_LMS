const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // obligatoire sur Render
});

async function initDB() {
    const client = await pool.connect();
    try {
        // Table courses
        await client.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                titre TEXT NOT NULL,
                description TEXT,
                formateur TEXT,
                niveau TEXT,
                categorie TEXT,
                statut TEXT DEFAULT 'actif',
                duree TEXT,
                inscrits INT DEFAULT 0,
                progression INT DEFAULT 0,
                modules INT DEFAULT 1
            )
        `);
        
        // Table students
        await client.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                nom TEXT NOT NULL,
                email TEXT UNIQUE,
                groupe TEXT,
                statut TEXT DEFAULT 'actif',
                avatar TEXT
            )
        `);
        
        // Table enrollments
        await client.query(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id SERIAL PRIMARY KEY,
                student_id INT REFERENCES students(id) ON DELETE CASCADE,
                course_id INT REFERENCES courses(id) ON DELETE CASCADE,
                progression INT DEFAULT 0,
                score INT DEFAULT 0,
                statut TEXT DEFAULT 'en_cours',
                certificat BOOLEAN DEFAULT FALSE,
                UNIQUE(student_id, course_id)
            )
        `);
        
        // Table quizzes
        await client.query(`
            CREATE TABLE IF NOT EXISTS quizzes (
                id SERIAL PRIMARY KEY,
                titre TEXT NOT NULL,
                course_id INT REFERENCES courses(id),
                questions JSONB NOT NULL,
                duree INT DEFAULT 5,
                score_min INT DEFAULT 50
            )
        `);
        
        // Table quiz_results
        await client.query(`
            CREATE TABLE IF NOT EXISTS quiz_results (
                id SERIAL PRIMARY KEY,
                quiz_id INT REFERENCES quizzes(id),
                student_id INT REFERENCES students(id),
                score INT NOT NULL,
                reponses JSONB,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Table announcements
        await client.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                titre TEXT NOT NULL,
                contenu TEXT,
                priorite TEXT DEFAULT 'normal',
                auteur TEXT,
                course_id INT REFERENCES courses(id),
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insertion de données de démo si tables vides
        const result = await client.query('SELECT COUNT(*) FROM courses');
        if (parseInt(result.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO courses (titre, description, formateur, niveau, duree, progression) VALUES
                ('HTML & CSS', 'Maîtrisez les bases du web', 'Maxime', 'Débutant', '20h', 75),
                ('JavaScript', 'Devenez expert en JS', 'Sophie', 'Intermédiaire', '35h', 45),
                ('React', 'Créez des apps modernes', 'Alex', 'Avancé', '40h', 20),
                ('Python', 'Programmation polyvalente', 'Julie', 'Débutant', '25h', 60)
            `);
        }
        
        const resultStudents = await client.query('SELECT COUNT(*) FROM students');
        if (parseInt(resultStudents.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO students (nom, email, groupe) VALUES
                ('Alice Martin', 'alice@email.com', 'G1'),
                ('Bob Durand', 'bob@email.com', 'G1'),
                ('Claire Petit', 'claire@email.com', 'G2')
            `);
        }
        
        console.log('✅ Base de données initialisée');
    } catch (err) {
        console.error('❌ Erreur init DB:', err);
    } finally {
        client.release();
    }
}

module.exports = { pool, initDB };
