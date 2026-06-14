/* ============================================================
   EduTrack LMS — Application principale
   ============================================================ */

'use strict';
// Données de démonstration (à ajouter temporairement)
const fakeCourses = [
    { id: 1, titre: "HTML & CSS", niveau: "Débutant", formateur: "Maxime", progression: 75 },
    { id: 2, titre: "JavaScript", niveau: "Intermédiaire", formateur: "Sophie", progression: 40 },
    { id: 3, titre: "React", niveau: "Avancé", formateur: "Alex", progression: 20 }
];

const fakeStudents = [
    { id: 1, nom: "Alice Martin", email: "alice@email.com", groupe: "G1" },
    { id: 2, nom: "Bob Durand", email: "bob@email.com", groupe: "G1" },
    { id: 3, nom: "Claire Petit", email: "claire@email.com", groupe: "G2" }
];
// ───────────────────────────────────────────────
// API helpers
// ───────────────────────────────────────────────
const API = {
  async get(table, params = {}) {
    const q = new URLSearchParams({ limit: 200, ...params }).toString();
    const r = await fetch(`tables/${table}?${q}`);
    if (!r.ok) throw new Error(`GET ${table} failed`);
    return r.json();
  },
  async getById(table, id) {
    const r = await fetch(`tables/${table}/${id}`);
    if (!r.ok) throw new Error(`GET ${table}/${id} failed`);
    return r.json();
  },
  async post(table, data) {
    const r = await fetch(`tables/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`POST ${table} failed`);
    return r.json();
  },
  async put(table, id, data) {
    const r = await fetch(`tables/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`PUT ${table}/${id} failed`);
    return r.json();
  },
  async delete(table, id) {
    const r = await fetch(`tables/${table}/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(`DELETE ${table}/${id} failed`);
  }
};

// ───────────────────────────────────────────────
// Toast
// ───────────────────────────────────────────────
function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  t.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ───────────────────────────────────────────────
// Cache données
// ───────────────────────────────────────────────
const Cache = {
  courses: [], students: [], modules: [],
  enrollments: [], quizzes: [], announcements: [],
  quizResults: []
};

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────
function scoreClass(s) {
  if (s >= 80) return 'score-high';
  if (s >= 60) return 'score-mid';
  return 'score-low';
}
function progressColor(p) {
  if (p >= 80) return '#10b981';
  if (p >= 40) return '#f59e0b';
  return '#6366f1';
}
function avatarInitials(name) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ───────────────────────────────────────────────
// Navigation
// ───────────────────────────────────────────────
const pageTitles = {
  dashboard: 'Tableau de bord',
  courses: 'Gestion des cours',
  students: 'Apprenants',
  progress: 'Suivi pédagogique',
  quizzes: 'Quiz & Évaluations',
  announcements: 'Annonces'
};

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');

  const link = document.querySelector(`[data-page="${pageId}"]`);
  if (link) link.classList.add('active');

  document.getElementById('page-title').textContent = pageTitles[pageId] || pageId;

  // Ferme le menu mobile
  document.getElementById('sidebar').classList.remove('mobile-open');

  // Charge la page
  switch (pageId) {
    case 'dashboard':    renderDashboard(); break;
    case 'courses':      renderCourses(); break;
    case 'students':     renderStudents(); break;
    case 'progress':     renderProgress(); break;
    case 'quizzes':      renderQuizzes(); break;
    case 'announcements':renderAnnouncements(); break;
  }
}

// ───────────────────────────────────────────────
// DASHBOARD
// ───────────────────────────────────────────────
let chartProgress = null;
let chartStatus = null;

async function renderDashboard() {
  // Stats
  const activeStudents = Cache.students.filter(s => s.status === 'Actif').length;
  const activeCourses = Cache.courses.filter(c => c.status === 'Actif').length;
  const certs = Cache.enrollments.filter(e => e.certificate_issued).length;
  const completed = Cache.enrollments.filter(e => e.status === 'Terminé').length;
  const total = Cache.enrollments.length;
  const rate = total > 0 ? Math.round(completed / total * 100) : 0;

  document.getElementById('stat-students').textContent = activeStudents;
  document.getElementById('stat-courses').textContent = activeCourses;
  document.getElementById('stat-completions').textContent = rate + '%';
  document.getElementById('stat-certs').textContent = certs;

  // Chart progression par cours
  const courseLabels = Cache.courses.map(c => c.title.substring(0, 20) + '...');
  const courseAvg = Cache.courses.map(c => {
    const enrs = Cache.enrollments.filter(e => e.course_id === c.id);
    if (!enrs.length) return 0;
    return Math.round(enrs.reduce((s, e) => s + (e.progress || 0), 0) / enrs.length);
  });

  const ctx1 = document.getElementById('chart-progress').getContext('2d');
  if (chartProgress) chartProgress.destroy();
  chartProgress = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: courseLabels,
      datasets: [{
        label: 'Progression moyenne (%)',
        data: courseAvg,
        backgroundColor: ['#6366f1','#10b981','#f59e0b','#06b6d4','#8b5cf6'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Chart statuts
  const statCounts = {
    'En cours': Cache.enrollments.filter(e => e.status === 'En cours').length,
    'Terminé': Cache.enrollments.filter(e => e.status === 'Terminé').length,
    'Non commencé': Cache.enrollments.filter(e => e.status === 'Non commencé').length,
    'Abandonné': Cache.enrollments.filter(e => e.status === 'Abandonné').length
  };
  const ctx2 = document.getElementById('chart-status').getContext('2d');
  if (chartStatus) chartStatus.destroy();
  chartStatus = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: Object.keys(statCounts),
      datasets: [{
        data: Object.values(statCounts),
        backgroundColor: ['#6366f1','#10b981','#94a3b8','#ef4444'],
        borderWidth: 2, borderColor: '#fff'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
      cutout: '65%'
    }
  });

  // Activité récente
  const actEl = document.getElementById('recent-activity');
  const recentEnrs = [...Cache.enrollments]
    .filter(e => e.status === 'Terminé' || e.status === 'En cours')
    .slice(0, 6);
  actEl.innerHTML = recentEnrs.map(e => {
    const st = Cache.students.find(s => s.id === e.student_id) || {};
    const co = Cache.courses.find(c => c.id === e.course_id) || {};
    const verb = e.status === 'Terminé' ? 'a terminé' : 'progresse dans';
    return `<li class="activity-item">
      <span class="activity-dot"></span>
      <span class="activity-text"><strong>${escapeHtml(st.name)}</strong> ${verb} <strong>${escapeHtml(co.title)}</strong></span>
      <span class="activity-time">${e.progress || 0}%</span>
    </li>`;
  }).join('') || '<li class="empty-state"><i class="fas fa-inbox"></i><p>Aucune activité</p></li>';

  // Annonces mini
  const annEl = document.getElementById('dash-announcements');
  annEl.innerHTML = Cache.announcements.slice(0, 4).map(a =>
    `<li class="ann-mini-item ${escapeHtml(a.priority)}">
      <div class="ann-mini-title">${escapeHtml(a.title)}</div>
      <div class="ann-mini-author">Par ${escapeHtml(a.author)}</div>
    </li>`
  ).join('') || '<li class="empty-state"><i class="fas fa-bullhorn"></i><p>Aucune annonce</p></li>';
}

// ───────────────────────────────────────────────
// COURSES
// ───────────────────────────────────────────────
function renderCourses() {
  // Populer les catégories
  const catSelect = document.getElementById('course-filter-category');
  const cats = [...new Set(Cache.courses.map(c => c.category).filter(Boolean))];
  catSelect.innerHTML = '<option value="">Toutes les catégories</option>' +
    cats.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');

  filterCourses();
}

function filterCourses() {
  const status = document.getElementById('course-filter-status').value;
  const level = document.getElementById('course-filter-level').value;
  const cat = document.getElementById('course-filter-category').value;
  const search = document.getElementById('global-search').value.toLowerCase();

  let filtered = Cache.courses.filter(c => {
    if (status && c.status !== status) return false;
    if (level && c.level !== level) return false;
    if (cat && c.category !== cat) return false;
    if (search && !c.title.toLowerCase().includes(search) &&
        !c.instructor.toLowerCase().includes(search)) return false;
    return true;
  });

  const grid = document.getElementById('courses-grid');
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-book-open"></i><p>Aucun cours trouvé</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(c => {
    const enrs = Cache.enrollments.filter(e => e.course_id === c.id);
    const avgProg = enrs.length ? Math.round(enrs.reduce((s, e) => s + (e.progress || 0), 0) / enrs.length) : 0;

    return `<article class="course-card" data-id="${escapeHtml(c.id)}">
      ${c.thumbnail
        ? `<img src="${escapeHtml(c.thumbnail)}" alt="${escapeHtml(c.title)}" class="course-thumbnail" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''}
      <div class="course-thumbnail-placeholder" ${c.thumbnail ? 'style="display:none"' : ''}>
        <i class="fas fa-book-open"></i>
      </div>
      <div class="course-body">
        <div class="course-meta">
          <span class="badge badge-level-${escapeHtml(c.level)}">${escapeHtml(c.level)}</span>
          <span class="badge badge-cat">${escapeHtml(c.category)}</span>
          <span class="badge badge-status-${escapeHtml(c.status)}">${escapeHtml(c.status)}</span>
        </div>
        <h3 class="course-title">${escapeHtml(c.title)}</h3>
        <p class="course-desc">${escapeHtml((c.description || '').substring(0, 90))}${(c.description || '').length > 90 ? '...' : ''}</p>
        <div class="progress-bar-wrap" style="margin-bottom:10px">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${avgProg}%;background:${progressColor(avgProg)}"></div>
          </div>
          <span class="progress-bar-text">${avgProg}%</span>
        </div>
        <div class="course-stats">
          <span class="course-stat"><i class="fas fa-clock"></i> ${c.duration || 0}h</span>
          <span class="course-stat"><i class="fas fa-users"></i> ${enrs.length} inscrits</span>
          <span class="course-stat"><i class="fas fa-layer-group"></i> ${c.modules_count || 0} modules</span>
          <span class="course-stat"><i class="fas fa-user-tie"></i> ${escapeHtml(c.instructor || '—')}</span>
        </div>
      </div>
      <div class="course-actions">
        <button class="btn-icon" title="Modifier" onclick="openEditCourse('${escapeHtml(c.id)}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger" title="Supprimer" onclick="deleteCourse('${escapeHtml(c.id)}')"><i class="fas fa-trash"></i></button>
      </div>
    </article>`;
  }).join('');
}

async function openEditCourse(id) {
  const c = Cache.courses.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-course-title').textContent = 'Modifier le cours';
  document.getElementById('course-id').value = c.id;
  document.getElementById('course-title').value = c.title || '';
  document.getElementById('course-description').value = c.description || '';
  document.getElementById('course-category').value = c.category || '';
  document.getElementById('course-level').value = c.level || '';
  document.getElementById('course-duration').value = c.duration || '';
  document.getElementById('course-instructor').value = c.instructor || '';
  document.getElementById('course-status').value = c.status || 'Actif';
  document.getElementById('course-modules').value = c.modules_count || '';
  document.getElementById('course-objectives').value = c.objectives || '';
  openModal('modal-course');
}

async function deleteCourse(id) {
  if (!confirm('Supprimer ce cours ?')) return;
  try {
    // Trouver l'id API
    const res = await API.get('courses');
    const row = res.data.find(r => r.id === id);
    if (row) await API.delete('courses', row.id);
    Cache.courses = Cache.courses.filter(c => c.id !== id);
    toast('Cours supprimé');
    renderCourses();
  } catch (e) { toast('Erreur lors de la suppression', 'error'); }
}

// ───────────────────────────────────────────────
// STUDENTS
// ───────────────────────────────────────────────
function renderStudents() {
  const groups = [...new Set(Cache.students.map(s => s.group).filter(Boolean))];
  const groupSel = document.getElementById('student-filter-group');
  groupSel.innerHTML = '<option value="">Tous les groupes</option>' +
    groups.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
  filterStudents();
}

function filterStudents() {
  const group = document.getElementById('student-filter-group').value;
  const status = document.getElementById('student-filter-status').value;
  const search = document.getElementById('global-search').value.toLowerCase();

  let filtered = Cache.students.filter(s => {
    if (group && s.group !== group) return false;
    if (status && s.status !== status) return false;
    if (search && !s.name.toLowerCase().includes(search) &&
        !(s.email || '').toLowerCase().includes(search)) return false;
    return true;
  });

  const tbody = document.getElementById('students-tbody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state"><i class="fas fa-users"></i><p>Aucun apprenant trouvé</p></div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const enrs = Cache.enrollments.filter(e => e.student_id === s.id);
    const avgProg = enrs.length
      ? Math.round(enrs.reduce((a, e) => a + (e.progress || 0), 0) / enrs.length) : 0;
    const courses = (s.enrolled_courses || [])
      .map(cid => Cache.courses.find(c => c.id === cid))
      .filter(Boolean);

    return `<tr>
      <td>
        <div class="student-info">
          <div class="student-avatar">${escapeHtml(s.avatar || avatarInitials(s.name))}</div>
          <div>
            <div class="student-name">${escapeHtml(s.name)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(s.email || '—')}</td>
      <td><span class="badge badge-cat">${escapeHtml(s.group || '—')}</span></td>
      <td>
        <div class="progress-bar-wrap" style="min-width:120px">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${avgProg}%;background:${progressColor(avgProg)}"></div>
          </div>
          <span class="progress-bar-text">${courses.length} cours</span>
        </div>
      </td>
      <td><span class="status-badge status-${escapeHtml(s.status)}">${escapeHtml(s.status)}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn-icon" title="Voir profil" onclick="openStudentDetail('${escapeHtml(s.id)}')"><i class="fas fa-eye"></i></button>
          <button class="btn-icon" title="Modifier" onclick="openEditStudent('${escapeHtml(s.id)}')"><i class="fas fa-edit"></i></button>
          <button class="btn-icon danger" title="Supprimer" onclick="deleteStudent('${escapeHtml(s.id)}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openEditStudent(id) {
  const s = Cache.students.find(x => x.id === id);
  if (!s) return;
  document.getElementById('modal-student-title').textContent = 'Modifier l\'apprenant';
  document.getElementById('student-id').value = s.id;
  document.getElementById('student-name').value = s.name || '';
  document.getElementById('student-email').value = s.email || '';
  document.getElementById('student-phone').value = s.phone || '';
  document.getElementById('student-group').value = s.group || '';
  document.getElementById('student-status').value = s.status || 'Actif';
  buildCoursesCheckboxes(s.enrolled_courses || []);
  openModal('modal-student');
}

function buildCoursesCheckboxes(selected = []) {
  const container = document.getElementById('courses-checkboxes');
  container.innerHTML = Cache.courses.map(c =>
    `<label class="course-check-label">
      <input type="checkbox" name="course-check" value="${escapeHtml(c.id)}"
        ${selected.includes(c.id) ? 'checked' : ''}/>
      ${escapeHtml(c.title)}
    </label>`
  ).join('');
}

async function deleteStudent(id) {
  if (!confirm('Supprimer cet apprenant ?')) return;
  try {
    const res = await API.get('students');
    const row = res.data.find(r => r.id === id);
    if (row) await API.delete('students', row.id);
    Cache.students = Cache.students.filter(s => s.id !== id);
    toast('Apprenant supprimé');
    renderStudents();
  } catch (e) { toast('Erreur lors de la suppression', 'error'); }
}

function openStudentDetail(id) {
  const s = Cache.students.find(x => x.id === id);
  if (!s) return;
  const enrs = Cache.enrollments.filter(e => e.student_id === id);

  document.getElementById('modal-detail-title').textContent = `Profil — ${s.name}`;
  const content = document.getElementById('student-detail-content');

  const coursesHtml = enrs.map(e => {
    const c = Cache.courses.find(x => x.id === e.course_id) || {};
    return `<div class="detail-course-item">
      <div class="detail-course-name">${escapeHtml(c.title || 'Cours inconnu')}</div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:4px;">
        <div class="progress-bar-wrap" style="flex:1;min-width:160px">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${e.progress || 0}%;background:${progressColor(e.progress || 0)}"></div>
          </div>
          <span class="progress-bar-text">${e.progress || 0}%</span>
        </div>
        <span class="status-badge status-${escapeHtml(e.status)}">${escapeHtml(e.status)}</span>
        <span class="${scoreClass(e.score || 0)}">Score: ${e.score || 0}/100</span>
        ${e.certificate_issued ? '<i class="fas fa-certificate cert-yes" title="Certificat émis"></i>' : ''}
      </div>
    </div>`;
  }).join('');

  content.innerHTML = `
    <div class="student-detail-header">
      <div class="student-detail-avatar">${escapeHtml(s.avatar || avatarInitials(s.name))}</div>
      <div class="student-detail-info">
        <h3>${escapeHtml(s.name)}</h3>
        <p>${escapeHtml(s.email || '—')} · ${escapeHtml(s.phone || '—')} · ${escapeHtml(s.group || '—')}</p>
        <p style="margin-top:4px;"><span class="status-badge status-${escapeHtml(s.status)}">${escapeHtml(s.status)}</span></p>
      </div>
    </div>
    <h4 style="font-size:14px;margin-bottom:10px;">Inscriptions (${enrs.length} cours)</h4>
    <div class="detail-courses">${coursesHtml || '<p style="color:var(--text-muted)">Aucun cours inscrit</p>'}</div>`;

  openModal('modal-student-detail');
}

// ───────────────────────────────────────────────
// PROGRESS
// ───────────────────────────────────────────────
function renderProgress() {
  // Remplir les selects
  const coursesSel = document.getElementById('prog-filter-course');
  coursesSel.innerHTML = '<option value="">Tous les cours</option>' +
    Cache.courses.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`).join('');

  const studentsSel = document.getElementById('prog-filter-student');
  studentsSel.innerHTML = '<option value="">Tous les apprenants</option>' +
    Cache.students.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('');

  filterProgress();
}

function filterProgress() {
  const courseId = document.getElementById('prog-filter-course').value;
  const studentId = document.getElementById('prog-filter-student').value;
  const status = document.getElementById('prog-filter-status').value;
  const search = document.getElementById('global-search').value.toLowerCase();

  let filtered = Cache.enrollments.filter(e => {
    if (courseId && e.course_id !== courseId) return false;
    if (studentId && e.student_id !== studentId) return false;
    if (status && e.status !== status) return false;
    if (search) {
      const st = Cache.students.find(s => s.id === e.student_id);
      const co = Cache.courses.find(c => c.id === e.course_id);
      if (!st?.name.toLowerCase().includes(search) &&
          !co?.title.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  // Summary cards
  const total = filtered.length;
  const done = filtered.filter(e => e.status === 'Terminé').length;
  const inProgress = filtered.filter(e => e.status === 'En cours').length;
  const avgScore = filtered.length
    ? Math.round(filtered.reduce((s, e) => s + (e.score || 0), 0) / filtered.length) : 0;

  const summaryEl = document.getElementById('progress-summary-cards');
  summaryEl.innerHTML = `
    <div class="summary-card">
      <div class="summary-val" style="color:#6366f1">${total}</div>
      <div class="summary-label">Inscriptions totales</div>
    </div>
    <div class="summary-card">
      <div class="summary-val" style="color:#10b981">${done}</div>
      <div class="summary-label">Cours terminés</div>
    </div>
    <div class="summary-card">
      <div class="summary-val" style="color:#f59e0b">${inProgress}</div>
      <div class="summary-label">En cours</div>
    </div>
    <div class="summary-card">
      <div class="summary-val ${scoreClass(avgScore)}">${avgScore}/100</div>
      <div class="summary-label">Score moyen</div>
    </div>`;

  const tbody = document.getElementById('progress-tbody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state"><i class="fas fa-chart-line"></i><p>Aucun résultat</p></div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => {
    const st = Cache.students.find(s => s.id === e.student_id) || {};
    const co = Cache.courses.find(c => c.id === e.course_id) || {};
    const score = e.score || 0;

    return `<tr>
      <td>
        <div class="student-info">
          <div class="student-avatar" style="width:30px;height:30px;font-size:11px">
            ${escapeHtml(st.avatar || avatarInitials(st.name || '?'))}
          </div>
          <div>
            <div class="student-name">${escapeHtml(st.name || '—')}</div>
            <div class="student-email">${escapeHtml(st.group || '')}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(co.title || '—')}</td>
      <td>
        <div class="progress-bar-wrap" style="min-width:140px">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${e.progress || 0}%;background:${progressColor(e.progress || 0)}"></div>
          </div>
          <span class="progress-bar-text">${e.progress || 0}%</span>
        </div>
      </td>
      <td><span class="${scoreClass(score)}">${score}/100</span></td>
      <td><span class="status-badge status-${escapeHtml(e.status)}">${escapeHtml(e.status)}</span></td>
      <td>
        ${e.certificate_issued
          ? '<i class="fas fa-certificate cert-yes" title="Certificat émis"></i>'
          : '<i class="fas fa-certificate cert-no" title="Non émis"></i>'}
      </td>
    </tr>`;
  }).join('');
}

function exportProgressCSV() {
  const rows = [['Apprenant', 'Email', 'Groupe', 'Cours', 'Progression', 'Score', 'Statut', 'Certificat']];
  Cache.enrollments.forEach(e => {
    const st = Cache.students.find(s => s.id === e.student_id) || {};
    const co = Cache.courses.find(c => c.id === e.course_id) || {};
    rows.push([
      st.name || '', st.email || '', st.group || '',
      co.title || '', (e.progress || 0) + '%', e.score || 0,
      e.status || '', e.certificate_issued ? 'Oui' : 'Non'
    ]);
  });
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'suivi-pedagogique.csv';
  a.click(); URL.revokeObjectURL(url);
  toast('Export CSV téléchargé', 'info');
}

// ───────────────────────────────────────────────
// QUIZZES
// ───────────────────────────────────────────────
function renderQuizzes() {
  const sel = document.getElementById('quiz-filter-course');
  sel.innerHTML = '<option value="">Tous les cours</option>' +
    Cache.courses.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`).join('');

  const quizCourseSel = document.getElementById('quiz-course');
  quizCourseSel.innerHTML = '<option value="">Sélectionner un cours...</option>' +
    Cache.courses.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`).join('');

  filterQuizzes();
}

function filterQuizzes() {
  const courseId = document.getElementById('quiz-filter-course').value;
  let filtered = Cache.quizzes.filter(q => !courseId || q.course_id === courseId);

  const container = document.getElementById('quizzes-container');
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">
      <i class="fas fa-question-circle"></i><p>Aucun quiz trouvé</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(q => {
    const co = Cache.courses.find(c => c.id === q.course_id) || {};
    let questions = [];
    try { questions = JSON.parse(q.questions || '[]'); } catch (e) {}
    const results = Cache.quizResults.filter(r => r.quiz_id === q.id);
    const avgScore = results.length
      ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length) : null;

    return `<div class="quiz-card">
      <div class="quiz-icon"><i class="fas fa-question-circle"></i></div>
      <div class="quiz-info">
        <div class="quiz-title">${escapeHtml(q.title)}</div>
        <div class="quiz-meta">
          <span><i class="fas fa-book-open"></i> ${escapeHtml(co.title || '—')}</span>
          <span><i class="fas fa-list"></i> ${questions.length} question(s)</span>
          <span><i class="fas fa-clock"></i> ${q.time_limit || 15} min</span>
          <span><i class="fas fa-check-circle"></i> Score min: ${q.passing_score || 60}%</span>
          <span><i class="fas fa-redo"></i> ${q.attempts_allowed || 3} tentative(s)</span>
          ${avgScore !== null ? `<span class="${scoreClass(avgScore)}"><i class="fas fa-star"></i> Moy: ${avgScore}/100</span>` : ''}
        </div>
      </div>
      <div class="quiz-actions">
        <button class="btn-primary" onclick="openTakeQuiz('${escapeHtml(q.id)}')">
          <i class="fas fa-play"></i> Passer
        </button>
        <button class="btn-icon" onclick="openEditQuiz('${escapeHtml(q.id)}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger" onclick="deleteQuiz('${escapeHtml(q.id)}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

// Passation de quiz
let quizTimer = null;
let quizTimeLeft = 0;

function openTakeQuiz(id) {
  const q = Cache.quizzes.find(x => x.id === id);
  if (!q) return;
  let questions = [];
  try { questions = JSON.parse(q.questions || '[]'); } catch (e) {}

  if (!questions.length) { toast('Ce quiz n\'a pas de questions', 'error'); return; }

  document.getElementById('modal-take-title').textContent = q.title;
  const content = document.getElementById('quiz-take-content');
  quizTimeLeft = (q.time_limit || 15) * 60;

  content.innerHTML = `
    <div style="padding:20px 24px 24px">
      <div class="quiz-take-header">
        <h3>${escapeHtml(q.title)}</h3>
        <div class="quiz-timer"><i class="fas fa-clock"></i> <span id="quiz-timer-display">${formatTime(quizTimeLeft)}</span></div>
      </div>
      <form id="form-take-quiz">
        ${questions.map((qu, qi) => `
          <div class="question-block">
            <div class="question-text">${qi + 1}. ${escapeHtml(qu.text)}</div>
            <div class="options-list">
              ${(qu.options || []).map((opt, oi) => `
                <label class="option-label" id="opt-${qi}-${oi}">
                  <input type="radio" name="q${qi}" value="${oi}"/>
                  ${escapeHtml(opt)}
                </label>`).join('')}
            </div>
          </div>`).join('')}
        <div style="text-align:center;margin-top:20px">
          <button type="submit" class="btn-primary" style="padding:12px 32px;font-size:15px">
            <i class="fas fa-paper-plane"></i> Soumettre
          </button>
        </div>
      </form>
    </div>`;

  // Timer
  if (quizTimer) clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    quizTimeLeft--;
    const disp = document.getElementById('quiz-timer-display');
    if (disp) disp.textContent = formatTime(quizTimeLeft);
    if (quizTimeLeft <= 0) {
      clearInterval(quizTimer);
      submitTakeQuiz(q, questions, true);
    }
  }, 1000);

  // Submit
  content.querySelector('#form-take-quiz').addEventListener('submit', (ev) => {
    ev.preventDefault();
    clearInterval(quizTimer);
    submitTakeQuiz(q, questions, false);
  });

  openModal('modal-take-quiz');
}

function formatTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function submitTakeQuiz(q, questions, timedOut) {
  let questions_arr = questions;
  let score = 0;
  const answers = [];

  questions_arr.forEach((qu, qi) => {
    const sel = document.querySelector(`input[name="q${qi}"]:checked`);
    const given = sel ? parseInt(sel.value) : -1;
    const correct = qu.correct;
    if (given === correct) score++;
    answers.push({ q: qi, given, correct });

    // Surligner
    (qu.options || []).forEach((_, oi) => {
      const label = document.getElementById(`opt-${qi}-${oi}`);
      if (!label) return;
      if (oi === correct) label.classList.add('correct');
      else if (oi === given && given !== correct) label.classList.add('wrong');
    });
  });

  const scorePercent = Math.round(score / questions_arr.length * 100);
  const passed = scorePercent >= (q.passing_score || 60);

  // Désactiver le formulaire
  const form = document.getElementById('form-take-quiz');
  if (form) {
    form.querySelectorAll('input, button').forEach(el => el.disabled = true);
    const resultDiv = document.createElement('div');
    resultDiv.className = 'quiz-result-box';
    resultDiv.innerHTML = `
      ${timedOut ? '<p style="color:var(--danger);font-weight:600;margin-bottom:8px">⏰ Temps écoulé !</p>' : ''}
      <div class="quiz-result-score ${passed ? 'passed' : 'failed'}">${scorePercent}%</div>
      <p style="font-size:16px;font-weight:700;margin:8px 0">${passed ? '🎉 Réussi !' : '😕 Non réussi'}</p>
      <p style="color:var(--text-muted)">${score}/${questions_arr.length} bonne(s) réponse(s) — Score minimum requis: ${q.passing_score || 60}%</p>`;
    form.insertAdjacentElement('afterend', resultDiv);
  }

  // Enregistrer le résultat
  try {
    await API.post('quiz_results', {
      id: 'qr_' + Date.now(),
      quiz_id: q.id,
      course_id: q.course_id,
      student_id: 'admin',
      score: scorePercent,
      passed,
      answers: JSON.stringify(answers),
      time_spent: ((q.time_limit || 15) * 60) - quizTimeLeft
    });
  } catch (e) { console.warn('Résultat quiz non enregistré'); }

  toast(passed ? `Bravo ! Vous avez obtenu ${scorePercent}%` : `${scorePercent}% — Score insuffisant`, passed ? 'success' : 'error');
}

function openEditQuiz(id) {
  const q = Cache.quizzes.find(x => x.id === id);
  if (!q) return;
  let questions = [];
  try { questions = JSON.parse(q.questions || '[]'); } catch (e) {}

  document.getElementById('modal-quiz-title').textContent = 'Modifier le quiz';
  document.getElementById('quiz-id').value = q.id;
  document.getElementById('quiz-title').value = q.title || '';
  document.getElementById('quiz-course').value = q.course_id || '';
  document.getElementById('quiz-passing').value = q.passing_score || 60;
  document.getElementById('quiz-time').value = q.time_limit || 15;
  document.getElementById('quiz-attempts').value = q.attempts_allowed || 3;

  const list = document.getElementById('questions-list');
  list.innerHTML = '';
  questions.forEach((qu, i) => addQuestionEditor(qu, i));
  openModal('modal-quiz');
}

async function deleteQuiz(id) {
  if (!confirm('Supprimer ce quiz ?')) return;
  try {
    const res = await API.get('quizzes');
    const row = res.data.find(r => r.id === id);
    if (row) await API.delete('quizzes', row.id);
    Cache.quizzes = Cache.quizzes.filter(q => q.id !== id);
    toast('Quiz supprimé');
    filterQuizzes();
  } catch (e) { toast('Erreur', 'error'); }
}

let questionCounter = 0;
function addQuestionEditor(qu = null, idx = null) {
  const list = document.getElementById('questions-list');
  const qIdx = idx !== null ? idx : questionCounter++;
  const div = document.createElement('div');
  div.className = 'question-editor';
  div.dataset.qi = qIdx;

  const opts = qu ? qu.options : ['', '', '', ''];
  const correct = qu ? qu.correct : 0;

  div.innerHTML = `
    <div class="question-editor-header">
      <span class="question-editor-title">Question ${qIdx + 1}</span>
      <button type="button" class="btn-icon danger" onclick="this.closest('.question-editor').remove()"><i class="fas fa-times"></i></button>
    </div>
    <div class="form-group">
      <label>Énoncé *</label>
      <input type="text" class="q-text" value="${escapeHtml(qu?.text || '')}" placeholder="Votre question..." required/>
    </div>
    <div style="margin-top:8px">
      <label style="font-size:12px;font-weight:600;color:var(--text-muted)">Options (cochez la bonne réponse)</label>
      ${opts.map((opt, oi) => `
        <div class="option-editor">
          <input type="radio" name="correct-q${qIdx}" value="${oi}" ${oi === correct ? 'checked' : ''}/>
          <span class="option-correct-label">✓</span>
          <input type="text" class="opt-text" value="${escapeHtml(opt)}" placeholder="Option ${oi + 1}..." required/>
        </div>`).join('')}
    </div>`;
  list.appendChild(div);
}

// ───────────────────────────────────────────────
// ANNOUNCEMENTS
// ───────────────────────────────────────────────
function renderAnnouncements() {
  const annCourseSel = document.getElementById('ann-course');
  annCourseSel.innerHTML = '<option value="">Tous les cours</option>' +
    Cache.courses.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`).join('');

  filterAnnouncements();
}

function filterAnnouncements() {
  const priority = document.getElementById('ann-filter-priority').value;
  const search = document.getElementById('global-search').value.toLowerCase();

  let filtered = Cache.announcements.filter(a => {
    if (priority && a.priority !== priority) return false;
    if (search && !a.title.toLowerCase().includes(search) &&
        !(a.content || '').toLowerCase().includes(search)) return false;
    return true;
  });

  const container = document.getElementById('announcements-list');
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-bullhorn"></i><p>Aucune annonce</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(a => {
    const co = a.course_id ? Cache.courses.find(c => c.id === a.course_id) : null;
    return `<div class="announcement-card ${escapeHtml(a.priority || 'Normal')}">
      <div class="ann-header">
        <h3 class="ann-title">${escapeHtml(a.title)}</h3>
        <span class="ann-priority-badge priority-${escapeHtml(a.priority || 'Normal')}">${escapeHtml(a.priority || 'Normal')}</span>
      </div>
      <p class="ann-content">${escapeHtml(a.content || '')}</p>
      <div class="ann-footer">
        <span>
          <i class="fas fa-user"></i> ${escapeHtml(a.author || '—')}
          ${co ? `· <i class="fas fa-book-open"></i> ${escapeHtml(co.title)}` : ''}
        </span>
        <div class="ann-footer-actions">
          <button class="btn-icon" onclick="openEditAnnouncement('${escapeHtml(a.id)}')"><i class="fas fa-edit"></i></button>
          <button class="btn-icon danger" onclick="deleteAnnouncement('${escapeHtml(a.id)}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openEditAnnouncement(id) {
  const a = Cache.announcements.find(x => x.id === id);
  if (!a) return;
  document.getElementById('modal-ann-title').textContent = 'Modifier l\'annonce';
  document.getElementById('ann-id').value = a.id;
  document.getElementById('ann-title').value = a.title || '';
  document.getElementById('ann-content').value = a.content || '';
  document.getElementById('ann-priority').value = a.priority || 'Normal';
  document.getElementById('ann-course').value = a.course_id || '';
  document.getElementById('ann-author').value = a.author || '';
  openModal('modal-announcement');
}

async function deleteAnnouncement(id) {
  if (!confirm('Supprimer cette annonce ?')) return;
  try {
    const res = await API.get('announcements');
    const row = res.data.find(r => r.id === id);
    if (row) await API.delete('announcements', row.id);
    Cache.announcements = Cache.announcements.filter(a => a.id !== id);
    toast('Annonce supprimée');
    renderAnnouncements();
  } catch (e) { toast('Erreur', 'error'); }
}

// ───────────────────────────────────────────────
// MODALS
// ───────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  // Nettoyage quiz timer
  if (id === 'modal-take-quiz' && quizTimer) {
    clearInterval(quizTimer);
    quizTimer = null;
  }
}

// ───────────────────────────────────────────────
// FORMULAIRES
// ───────────────────────────────────────────────

// Form Cours
document.getElementById('form-course').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('course-id').value;
  const data = {
    id: id || 'c_' + Date.now(),
    title: document.getElementById('course-title').value.trim(),
    description: document.getElementById('course-description').value.trim(),
    category: document.getElementById('course-category').value.trim(),
    level: document.getElementById('course-level').value,
    duration: parseInt(document.getElementById('course-duration').value) || 0,
    instructor: document.getElementById('course-instructor').value.trim(),
    status: document.getElementById('course-status').value,
    modules_count: parseInt(document.getElementById('course-modules').value) || 0,
    objectives: document.getElementById('course-objectives').value.trim()
  };
  try {
    if (id) {
      // Update
      const res = await API.get('courses');
      const row = res.data.find(r => r.id === id);
      if (row) {
        const updated = await API.put('courses', row.id, data);
        const idx = Cache.courses.findIndex(c => c.id === id);
        if (idx >= 0) Cache.courses[idx] = { ...Cache.courses[idx], ...data };
      }
      toast('Cours mis à jour !');
    } else {
      // Create
      const created = await API.post('courses', data);
      Cache.courses.push({ ...data, id: created.id || data.id });
      toast('Cours créé avec succès !');
    }
    closeModal('modal-course');
    renderCourses();
  } catch (e) { toast('Erreur lors de l\'enregistrement', 'error'); }
});

// Form Étudiant
document.getElementById('form-student').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('student-id').value;
  const checked = [...document.querySelectorAll('input[name="course-check"]:checked')].map(x => x.value);
  const nameVal = document.getElementById('student-name').value.trim();
  const data = {
    id: id || 's_' + Date.now(),
    name: nameVal,
    email: document.getElementById('student-email').value.trim(),
    phone: document.getElementById('student-phone').value.trim(),
    group: document.getElementById('student-group').value.trim(),
    status: document.getElementById('student-status').value,
    avatar: avatarInitials(nameVal),
    enrolled_courses: checked
  };
  try {
    if (id) {
      const res = await API.get('students');
      const row = res.data.find(r => r.id === id);
      if (row) await API.put('students', row.id, data);
      const idx = Cache.students.findIndex(s => s.id === id);
      if (idx >= 0) Cache.students[idx] = { ...Cache.students[idx], ...data };
      toast('Apprenant mis à jour !');
    } else {
      const created = await API.post('students', data);
      Cache.students.push({ ...data, id: created.id || data.id });
      toast('Apprenant ajouté !');
    }
    closeModal('modal-student');
    renderStudents();
  } catch (e) { toast('Erreur lors de l\'enregistrement', 'error'); }
});

// Form Quiz
document.getElementById('form-quiz').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('quiz-id').value;

  // Collecter les questions
  const editors = document.querySelectorAll('.question-editor');
  const questions = [...editors].map((ed) => {
    const text = ed.querySelector('.q-text')?.value.trim() || '';
    const options = [...ed.querySelectorAll('.opt-text')].map(i => i.value.trim());
    const correctInput = ed.querySelector('input[type="radio"]:checked');
    const correct = correctInput ? parseInt(correctInput.value) : 0;
    return { text, options, correct };
  }).filter(q => q.text);

  if (!questions.length) { toast('Ajoutez au moins une question', 'error'); return; }

  const data = {
    id: id || 'q_' + Date.now(),
    title: document.getElementById('quiz-title').value.trim(),
    course_id: document.getElementById('quiz-course').value,
    passing_score: parseInt(document.getElementById('quiz-passing').value) || 60,
    time_limit: parseInt(document.getElementById('quiz-time').value) || 15,
    attempts_allowed: parseInt(document.getElementById('quiz-attempts').value) || 3,
    questions: JSON.stringify(questions)
  };

  try {
    if (id) {
      const res = await API.get('quizzes');
      const row = res.data.find(r => r.id === id);
      if (row) await API.put('quizzes', row.id, data);
      const idx = Cache.quizzes.findIndex(q => q.id === id);
      if (idx >= 0) Cache.quizzes[idx] = { ...Cache.quizzes[idx], ...data };
      toast('Quiz mis à jour !');
    } else {
      const created = await API.post('quizzes', data);
      Cache.quizzes.push({ ...data, id: created.id || data.id });
      toast('Quiz créé !');
    }
    closeModal('modal-quiz');
    filterQuizzes();
  } catch (e) { toast('Erreur lors de l\'enregistrement', 'error'); }
});

// Form Annonce
document.getElementById('form-announcement').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('ann-id').value;
  const data = {
    id: id || 'a_' + Date.now(),
    title: document.getElementById('ann-title').value.trim(),
    content: document.getElementById('ann-content').value.trim(),
    priority: document.getElementById('ann-priority').value,
    course_id: document.getElementById('ann-course').value,
    author: document.getElementById('ann-author').value.trim()
  };
  try {
    if (id) {
      const res = await API.get('announcements');
      const row = res.data.find(r => r.id === id);
      if (row) await API.put('announcements', row.id, data);
      const idx = Cache.announcements.findIndex(a => a.id === id);
      if (idx >= 0) Cache.announcements[idx] = { ...Cache.announcements[idx], ...data };
      toast('Annonce mise à jour !');
    } else {
      const created = await API.post('announcements', data);
      Cache.announcements.push({ ...data, id: created.id || data.id });
      toast('Annonce publiée !');
    }
    closeModal('modal-announcement');
    renderAnnouncements();
  } catch (e) { toast('Erreur lors de la publication', 'error'); }
});

// ───────────────────────────────────────────────
// EVENTS
// ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // btn-link (dashboard)
  document.addEventListener('click', (e) => {
    const bl = e.target.closest('[data-page]');
    if (bl && bl.classList.contains('btn-link')) {
      e.preventDefault();
      navigateTo(bl.dataset.page);
    }
  });

  // Sidebar toggle desktop
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    const mw = document.getElementById('main-wrapper');
    sb.classList.toggle('collapsed');
    mw.classList.toggle('expanded');
  });

  // Sidebar toggle mobile
  document.getElementById('mobile-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('mobile-open');
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) closeModal(m.id);
    });
  });

  // Close buttons
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  // Ouvrir modals (boutons principaux)
  document.getElementById('btn-add-course').addEventListener('click', () => {
    document.getElementById('modal-course-title').textContent = 'Nouveau cours';
    document.getElementById('course-id').value = '';
    document.getElementById('form-course').reset();
    openModal('modal-course');
  });

  document.getElementById('btn-add-student').addEventListener('click', () => {
    document.getElementById('modal-student-title').textContent = 'Nouvel apprenant';
    document.getElementById('student-id').value = '';
    document.getElementById('form-student').reset();
    buildCoursesCheckboxes([]);
    openModal('modal-student');
  });

  document.getElementById('btn-add-quiz').addEventListener('click', () => {
    document.getElementById('modal-quiz-title').textContent = 'Nouveau quiz';
    document.getElementById('quiz-id').value = '';
    document.getElementById('form-quiz').reset();
    document.getElementById('questions-list').innerHTML = '';
    questionCounter = 0;
    addQuestionEditor(); addQuestionEditor();
    openModal('modal-quiz');
  });

  document.getElementById('btn-add-announcement').addEventListener('click', () => {
    document.getElementById('modal-ann-title').textContent = 'Nouvelle annonce';
    document.getElementById('ann-id').value = '';
    document.getElementById('form-announcement').reset();
    openModal('modal-announcement');
  });

  // Ajouter question
  document.getElementById('btn-add-question').addEventListener('click', () => {
    addQuestionEditor();
  });

  // Filtres cours
  document.getElementById('course-filter-status').addEventListener('change', filterCourses);
  document.getElementById('course-filter-level').addEventListener('change', filterCourses);
  document.getElementById('course-filter-category').addEventListener('change', filterCourses);

  // Filtres étudiants
  document.getElementById('student-filter-group').addEventListener('change', filterStudents);
  document.getElementById('student-filter-status').addEventListener('change', filterStudents);

  // Filtres progress
  document.getElementById('prog-filter-course').addEventListener('change', filterProgress);
  document.getElementById('prog-filter-student').addEventListener('change', filterProgress);
  document.getElementById('prog-filter-status').addEventListener('change', filterProgress);

  // Filtres quiz
  document.getElementById('quiz-filter-course').addEventListener('change', filterQuizzes);

  // Filtres annonces
  document.getElementById('ann-filter-priority').addEventListener('change', filterAnnouncements);

  // Recherche globale
  let searchTimeout;
  document.getElementById('global-search').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const active = document.querySelector('.nav-link.active')?.dataset.page;
      if (active === 'courses') filterCourses();
      else if (active === 'students') filterStudents();
      else if (active === 'progress') filterProgress();
      else if (active === 'announcements') filterAnnouncements();
    }, 300);
  });

  // Export CSV
  document.getElementById('btn-export-progress').addEventListener('click', exportProgressCSV);

  // Init
  loadAllData();
});

// ───────────────────────────────────────────────
// CHARGEMENT DES DONNÉES
// ───────────────────────────────────────────────
async function loadAllData() {
  const loadEl = document.getElementById('page-dashboard');
  loadEl.innerHTML = `<div class="loader"><div class="spinner"></div> Chargement des données...</div>`;

  try {
    const [
      coursesRes, studentsRes, modulesRes,
      enrollmentsRes, quizzesRes, announcementsRes, qrRes
    ] = await Promise.all([
      API.get('courses'),
      API.get('students'),
      API.get('modules'),
      API.get('enrollments'),
      API.get('quizzes'),
      API.get('announcements'),
      API.get('quiz_results')
    ]);

    Cache.courses       = coursesRes.data || [];
    Cache.students      = studentsRes.data || [];
    Cache.modules       = modulesRes.data || [];
    Cache.enrollments   = enrollmentsRes.data || [];
    Cache.quizzes       = quizzesRes.data || [];
    Cache.announcements = announcementsRes.data || [];
    Cache.quizResults   = qrRes.data || [];

    // Restaurer la structure du dashboard
    loadEl.innerHTML = `
      <div class="stats-grid">
        <article class="stat-card card-blue">
          <div class="stat-icon"><i class="fas fa-users"></i></div>
          <div class="stat-info">
            <span class="stat-value" id="stat-students">0</span>
            <span class="stat-label">Apprenants actifs</span>
          </div>
          <div class="stat-trend up"><i class="fas fa-arrow-up"></i> +2 ce mois</div>
        </article>
        <article class="stat-card card-green">
          <div class="stat-icon"><i class="fas fa-book-open"></i></div>
          <div class="stat-info">
            <span class="stat-value" id="stat-courses">0</span>
            <span class="stat-label">Cours actifs</span>
          </div>
          <div class="stat-trend up"><i class="fas fa-arrow-up"></i> +1 ce mois</div>
        </article>
        <article class="stat-card card-orange">
          <div class="stat-icon"><i class="fas fa-chart-pie"></i></div>
          <div class="stat-info">
            <span class="stat-value" id="stat-completions">0%</span>
            <span class="stat-label">Taux de complétion</span>
          </div>
          <div class="stat-trend up"><i class="fas fa-arrow-up"></i> +5% ce mois</div>
        </article>
        <article class="stat-card card-purple">
          <div class="stat-icon"><i class="fas fa-certificate"></i></div>
          <div class="stat-info">
            <span class="stat-value" id="stat-certs">0</span>
            <span class="stat-label">Certificats émis</span>
          </div>
          <div class="stat-trend up"><i class="fas fa-arrow-up"></i> +3 ce mois</div>
        </article>
      </div>
      <div class="dashboard-grid">
        <div class="dash-card">
          <div class="card-header"><h2>Progression par cours</h2></div>
          <div class="chart-container" style="height:300px;"><canvas id="chart-progress"></canvas></div>
        </div>
        <div class="dash-card">
          <div class="card-header"><h2>Répartition des statuts</h2></div>
          <div class="chart-container" style="height:300px;"><canvas id="chart-status"></canvas></div>
        </div>
        <div class="dash-card">
          <div class="card-header">
            <h2>Activité récente</h2>
            <a href="#" class="btn-link" data-page="progress">Voir tout</a>
          </div>
          <ul id="recent-activity" class="activity-list"></ul>
        </div>
        <div class="dash-card">
          <div class="card-header">
            <h2>Annonces récentes</h2>
            <a href="#" class="btn-link" data-page="announcements">Voir tout</a>
          </div>
          <ul id="dash-announcements" class="announcement-mini-list"></ul>
        </div>
      </div>`;

    loadEl.classList.add('active');
    renderDashboard();

    toast('Données chargées avec succès', 'success');
  } catch (e) {
    console.error(e);
    loadEl.innerHTML = `<div class="empty-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>Impossible de charger les données. Vérifiez votre connexion.</p>
    </div>`;
    toast('Erreur de chargement des données', 'error');
  }
}
