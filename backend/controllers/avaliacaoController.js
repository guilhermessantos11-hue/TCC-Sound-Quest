const db = require("../config/database");
const { maybeIssueCertificate, calcContentProgress } = require("./certificadoController");

function submit(req, res) {
  const activity = db.prepare("SELECT * FROM activities WHERE id = ?").get(req.params.id);
  if (!activity) return res.status(404).json({ error: "Avaliacao nao encontrada." });
  const contentDone = calcContentProgress(req.user.id, activity.training_id);
  if (contentDone < 100) {
    return res.status(400).json({ error: "Conclua todos os modulos antes de iniciar a avaliacao." });
  }
  const answers = req.body.answers || {};
  const questions = db.prepare("SELECT * FROM questions WHERE activity_id = ?").all(activity.id);
  let correct = 0;
  questions.forEach((q) => {
    const selected = Number(answers[q.id]);
    const opt = db.prepare("SELECT * FROM options WHERE id = ? AND question_id = ?").get(selected, q.id);
    if (opt && opt.is_correct) correct += 1;
  });
  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const passed = score >= activity.passing_score ? 1 : 0;
  db.prepare("INSERT INTO attempts (user_id, activity_id, score, passed, answers) VALUES (?, ?, ?, ?, ?)").run(
    req.user.id, activity.id, score, passed, JSON.stringify(answers)
  );
  const info = maybeIssueCertificate(req.user.id, activity.training_id);
  const certificate = db.prepare("SELECT * FROM certificates WHERE user_id = ? AND training_id = ?").get(req.user.id, activity.training_id);
  const total = questions.length;
  res.json({
    score,
    correct,
    total,
    passed: !!passed,
    passing_score: activity.passing_score,
    certificate,
    progress: info.display,
    completed: info.completed
  });
}

function myAttempts(req, res) {
  const rows = db.prepare(
    `SELECT a.*, ac.title AS activity_title, ac.passing_score, t.id AS training_id, t.title AS training_title, t.category
     FROM attempts a
     JOIN activities ac ON ac.id = a.activity_id
     JOIN trainings t ON t.id = ac.training_id
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC`
  ).all(req.user.id);
  const trainings = db.prepare(
    `SELECT t.id, t.title, t.category, e.status, e.progress, ac.id AS activity_id, ac.passing_score,
      (SELECT MAX(score) FROM attempts WHERE user_id = ? AND activity_id = ac.id) AS best_score,
      (SELECT COUNT(*) FROM contents c JOIN modules m ON m.id = c.module_id WHERE m.training_id = t.id) AS total_contents,
      (SELECT COUNT(*) FROM content_progress cp JOIN contents c ON c.id = cp.content_id JOIN modules m ON m.id = c.module_id
        WHERE cp.user_id = ? AND m.training_id = t.id AND cp.completed = 1) AS done_contents
     FROM enrollments e
     JOIN trainings t ON t.id = e.training_id
     LEFT JOIN activities ac ON ac.training_id = t.id
     WHERE e.user_id = ?
     ORDER BY t.title`
  ).all(req.user.id, req.user.id, req.user.id);
  res.json({ attempts: rows, trainings });
}

function saveActivity(req, res) {
  const t = db.prepare("SELECT * FROM trainings WHERE id = ? AND company_id = ?").get(req.params.id, req.user.company_id);
  if (!t) return res.status(404).json({ error: "Treinamento nao encontrado." });
  const { title, description, passing_score, questions } = req.body || {};
  if (!title) return res.status(400).json({ error: "Informe o titulo da avaliacao." });
  const existing = db.prepare("SELECT id FROM activities WHERE training_id = ?").get(t.id);
  let activityId;
  if (existing) {
    db.prepare("UPDATE activities SET title = ?, description = ?, passing_score = ? WHERE id = ?").run(title, description || "", Number(passing_score) || 70, existing.id);
    db.prepare("DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE activity_id = ?)").run(existing.id);
    db.prepare("DELETE FROM questions WHERE activity_id = ?").run(existing.id);
    activityId = existing.id;
  } else {
    activityId = db.prepare("INSERT INTO activities (training_id, title, description, passing_score) VALUES (?, ?, ?, ?)").run(t.id, title, description || "", Number(passing_score) || 70).lastInsertRowid;
  }
  (questions || []).forEach((q, i) => {
    const qid = db.prepare("INSERT INTO questions (activity_id, prompt, order_index) VALUES (?, ?, ?)").run(activityId, q.prompt, i).lastInsertRowid;
    (q.options || []).forEach((o) => {
      db.prepare("INSERT INTO options (question_id, label, is_correct) VALUES (?, ?, ?)").run(qid, o.label, o.is_correct ? 1 : 0);
    });
  });
  res.json({ ok: true, activity_id: activityId });
}

function attempts(req, res) {
  const rows = db.prepare(
    `SELECT a.*, u.name AS user_name, ac.title AS activity_title, t.title AS training_title
     FROM attempts a JOIN users u ON u.id = a.user_id
     JOIN activities ac ON ac.id = a.activity_id JOIN trainings t ON t.id = ac.training_id
     WHERE t.company_id = ? ORDER BY a.created_at DESC`
  ).all(req.user.company_id);
  res.json(rows);
}

module.exports = { submit, saveActivity, attempts, myAttempts };
