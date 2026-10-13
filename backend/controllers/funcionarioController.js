const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { overallProgress } = require("./certificadoController");

function dashboard(req, res) {
  const enrollments = db
    .prepare(
      `SELECT e.*, t.title, t.category, t.duration_minutes, t.level, t.thumbnail
       FROM enrollments e JOIN trainings t ON t.id = e.training_id
       WHERE e.user_id = ? ORDER BY e.enrolled_at DESC`
    )
    .all(req.user.id);
  const available = db
    .prepare(
      `SELECT t.* FROM trainings t
       WHERE t.company_id = ? AND t.status = 'published'
       AND t.id NOT IN (SELECT training_id FROM enrollments WHERE user_id = ?)`
    )
    .all(req.user.company_id, req.user.id);
  const certificates = db
    .prepare(
      `SELECT c.*, t.title FROM certificates c JOIN trainings t ON t.id = c.training_id
       WHERE c.user_id = ? ORDER BY c.issued_at DESC`
    )
    .all(req.user.id);
  const enriched = enrollments.map((e) => {
    const info = overallProgress(req.user.id, e.training_id);
    return { ...e, progress: info.display, status: info.completed ? "completed" : "in_progress", stage: info.stage, exam: info.exam, content_progress: info.content };
  });
  const avg = enriched.length
    ? Math.round(enriched.reduce((s, e) => s + e.progress, 0) / enriched.length)
    : 0;
  const requiredList = db
    .prepare(
      `SELECT t.*, e.status, e.progress FROM trainings t
       LEFT JOIN enrollments e ON e.training_id = t.id AND e.user_id = ?
       WHERE t.company_id = ? AND t.status = 'published' AND COALESCE(t.required, 0) = 1`
    )
    .all(req.user.id, req.user.company_id);
  res.json({
    stats: {
      enrolled: enriched.length,
      completed: enriched.filter((e) => e.status === "completed").length,
      in_progress: enriched.filter((e) => e.status === "in_progress").length,
      required: requiredList.length,
      required_pending: requiredList.filter((t) => t.status !== "completed").length,
      certificates: certificates.length,
      avg_progress: avg
    },
    enrollments: enriched,
    available,
    certificates,
    required: requiredList,
    tasks: db.prepare(
      `SELECT tk.id, tk.title, tk.due_at, t.title AS training_title,
        COALESCE(s.status, 'pending') AS status
       FROM tasks tk
       JOIN trainings t ON t.id = tk.training_id
       JOIN enrollments e ON e.training_id = t.id AND e.user_id = ?
       LEFT JOIN task_submissions s ON s.task_id = tk.id AND s.user_id = ?
       ORDER BY tk.due_at IS NULL, tk.due_at LIMIT 8`
    ).all(req.user.id, req.user.id)
  });
}

function companyDashboard(req, res) {
  const cid = req.user.company_id;
  const collaborators = db.prepare("SELECT COUNT(*) AS n FROM users WHERE company_id = ? AND role = 'collaborator'").get(cid).n;
  const trainings = db.prepare("SELECT COUNT(*) AS n FROM trainings WHERE company_id = ?").get(cid).n;
  const enrollments = db.prepare(`SELECT COUNT(*) AS n FROM enrollments e JOIN users u ON u.id = e.user_id WHERE u.company_id = ?`).get(cid).n;
  const completed = db.prepare(`SELECT COUNT(*) AS n FROM enrollments e JOIN users u ON u.id = e.user_id WHERE u.company_id = ? AND e.status = 'completed'`).get(cid).n;
  const certificates = db.prepare(`SELECT COUNT(*) AS n FROM certificates c JOIN users u ON u.id = c.user_id WHERE u.company_id = ?`).get(cid).n;
  const byTraining = db.prepare(
    `SELECT t.id, t.title, t.category, COUNT(e.id) AS enrolled,
      SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed,
      ROUND(AVG(e.progress), 0) AS avg_progress
     FROM trainings t LEFT JOIN enrollments e ON e.training_id = t.id
     WHERE t.company_id = ? GROUP BY t.id ORDER BY t.title`
  ).all(cid);
  const byDept = db.prepare(
    `SELECT COALESCE(u.department, 'Nao informado') AS department,
      COUNT(DISTINCT u.id) AS people, ROUND(AVG(e.progress), 0) AS avg_progress
     FROM users u LEFT JOIN enrollments e ON e.user_id = u.id
     WHERE u.company_id = ? AND u.role = 'collaborator' GROUP BY department`
  ).all(cid);
  const taskStats = db.prepare(
    `SELECT COUNT(tk.id) AS total,
      COALESCE(SUM(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END), 0) AS approved,
      COALESCE(SUM(CASE WHEN s.status = 'submitted' THEN 1 ELSE 0 END), 0) AS submitted,
      COALESCE(SUM(CASE WHEN s.status IS NULL OR s.status = 'pending' OR s.status = 'rejected' THEN 1 ELSE 0 END), 0) AS pending
     FROM tasks tk
     JOIN trainings t ON t.id = tk.training_id
     JOIN enrollments e ON e.training_id = t.id
     JOIN users u ON u.id = e.user_id
     LEFT JOIN task_submissions s ON s.task_id = tk.id AND s.user_id = u.id
     WHERE t.company_id = ?`
  ).get(cid);
  const recentAttempts = db.prepare(
    `SELECT a.id, a.score, a.passed, a.created_at, u.name AS user_name, ac.title AS activity_title, t.title AS training_title
     FROM attempts a JOIN users u ON u.id = a.user_id
     JOIN activities ac ON ac.id = a.activity_id JOIN trainings t ON t.id = ac.training_id
     WHERE t.company_id = ? ORDER BY a.created_at DESC LIMIT 8`
  ).all(cid);
  res.json({ stats: { collaborators, trainings, enrollments, completed, certificates, tasks: taskStats }, byTraining, byDept, recentAttempts });
}

function list(req, res) {
  const rows = db.prepare(
    `SELECT u.id, u.name, u.email, u.department, u.position, u.status, u.created_at,
      (SELECT COUNT(*) FROM enrollments WHERE user_id = u.id) AS enrollments,
      (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) AS certificates,
      (SELECT ROUND(AVG(progress),0) FROM enrollments WHERE user_id = u.id) AS avg_progress
     FROM users u WHERE u.company_id = ? AND u.role = 'collaborator' ORDER BY u.name`
  ).all(req.user.company_id);
  res.json(rows);
}

function create(req, res) {
  const { name, email, password, department, position, phone } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Nome, e-mail e senha sao obrigatorios." });
  const emailNorm = String(email).trim().toLowerCase();
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(emailNorm)) {
    return res.status(409).json({ error: "E-mail ja cadastrado." });
  }
  const id = db.prepare(
    `INSERT INTO users (company_id, name, email, password_hash, role, department, position, phone)
     VALUES (?, ?, ?, ?, 'collaborator', ?, ?, ?)`
  ).run(req.user.company_id, name.trim(), emailNorm, bcrypt.hashSync(password, 10), department || null, position || null, phone || null).lastInsertRowid;
  res.status(201).json(db.prepare("SELECT id, name, email, department, position, status FROM users WHERE id = ?").get(id));
}

function update(req, res) {
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND company_id = ? AND role = 'collaborator'").get(req.params.id, req.user.company_id);
  if (!user) return res.status(404).json({ error: "Colaborador nao encontrado." });
  const { name, email, department, position, phone, status } = req.body || {};
  db.prepare(
    `UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email),
      department = COALESCE(?, department), position = COALESCE(?, position),
      phone = COALESCE(?, phone), status = COALESCE(?, status) WHERE id = ?`
  ).run(name || null, email ? String(email).toLowerCase() : null, department || null, position || null, phone || null, status || null, user.id);
  res.json(db.prepare("SELECT id, name, email, department, position, phone, status FROM users WHERE id = ?").get(user.id));
}

function remove(req, res) {
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND company_id = ? AND role = 'collaborator'").get(req.params.id, req.user.company_id);
  if (!user) return res.status(404).json({ error: "Colaborador nao encontrado." });
  db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  res.json({ ok: true });
}

function progress(req, res) {
  const rows = db.prepare(
    `SELECT e.*, u.name AS user_name, u.department, t.title AS training_title, t.category
     FROM enrollments e JOIN users u ON u.id = e.user_id JOIN trainings t ON t.id = e.training_id
     WHERE u.company_id = ? ORDER BY e.enrolled_at DESC`
  ).all(req.user.company_id);
  res.json(rows);
}

function reports(req, res) {
  const cid = req.user.company_id;
  res.json({
    completionRate: db.prepare(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed
       FROM enrollments e JOIN users u ON u.id = e.user_id WHERE u.company_id = ?`
    ).get(cid),
    scores: db.prepare(
      `SELECT t.title, ROUND(AVG(a.score),0) AS avg_score, COUNT(a.id) AS attempts
       FROM attempts a JOIN activities ac ON ac.id = a.activity_id JOIN trainings t ON t.id = ac.training_id
       WHERE t.company_id = ? GROUP BY t.id`
    ).all(cid)
  });
}

module.exports = { dashboard, companyDashboard, list, create, update, remove, progress, reports };
