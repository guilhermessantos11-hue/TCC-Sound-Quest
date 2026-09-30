const db = require("../config/database");
const { overallProgress, maybeIssueCertificate } = require("./certificadoController");

function trainingPayload(training, userId) {
  const modules = db.prepare("SELECT * FROM modules WHERE training_id = ? ORDER BY order_index, id").all(training.id).map((m) => ({
    ...m,
    contents: db.prepare("SELECT * FROM contents WHERE module_id = ? ORDER BY order_index, id").all(m.id)
  }));
  const activity = db.prepare("SELECT * FROM activities WHERE training_id = ?").get(training.id);
  if (activity) {
    activity.questions = db.prepare("SELECT id, prompt, order_index FROM questions WHERE activity_id = ? ORDER BY order_index, id").all(activity.id).map((q) => ({
      ...q,
      options: db.prepare("SELECT id, label FROM options WHERE question_id = ?").all(q.id)
    }));
  }
  const enrollment = userId ? db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND training_id = ?").get(userId, training.id) : null;
  const certificate = userId ? db.prepare("SELECT * FROM certificates WHERE user_id = ? AND training_id = ?").get(userId, training.id) : null;
  const progressInfo = userId ? overallProgress(userId, training.id) : null;
  return { ...training, modules, activity, enrollment, certificate, progressInfo };
}

function listPublished(req, res) {
  const rows = db.prepare("SELECT * FROM trainings WHERE company_id = ? AND status = 'published' ORDER BY created_at DESC").all(req.user.company_id);
  res.json(rows.map((t) => {
    const enrollment = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND training_id = ?").get(req.user.id, t.id);
    const modules = db.prepare("SELECT COUNT(*) AS n FROM modules WHERE training_id = ?").get(t.id).n;
    return { ...t, enrollment, modules_count: modules };
  }));
}

function getOne(req, res) {
  const training = db.prepare("SELECT * FROM trainings WHERE id = ? AND company_id = ?").get(req.params.id, req.user.company_id);
  if (!training) return res.status(404).json({ error: "Treinamento nao encontrado." });
  const payload = trainingPayload(training, req.user.id);
  if (req.user.role === "collaborator") {
    payload.completed_contents = db
      .prepare("SELECT content_id FROM content_progress WHERE user_id = ? AND completed = 1")
      .all(req.user.id)
      .map((r) => r.content_id);
    if (payload.activity) {
      payload.lastAttempt = db
        .prepare("SELECT * FROM attempts WHERE user_id = ? AND activity_id = ? ORDER BY created_at DESC LIMIT 1")
        .get(req.user.id, payload.activity.id);
    }
  }
  res.json(payload);
}

function enroll(req, res) {
  const training = db.prepare("SELECT * FROM trainings WHERE id = ? AND company_id = ? AND status = 'published'").get(req.params.id, req.user.company_id);
  if (!training) return res.status(404).json({ error: "Treinamento indisponivel." });
  try {
    db.prepare("INSERT INTO enrollments (user_id, training_id) VALUES (?, ?)").run(req.user.id, training.id);
  } catch {
    return res.status(409).json({ error: "Voce ja esta inscrito neste treinamento." });
  }
  res.status(201).json({ ok: true });
}

function listCompany(req, res) {
  const rows = db.prepare(
    `SELECT t.*,
      (SELECT COUNT(*) FROM modules WHERE training_id = t.id) AS modules_count,
      (SELECT COUNT(*) FROM enrollments WHERE training_id = t.id) AS enrolled,
      (SELECT ROUND(AVG(progress),0) FROM enrollments WHERE training_id = t.id) AS avg_progress
     FROM trainings t WHERE t.company_id = ? ORDER BY t.created_at DESC`
  ).all(req.user.company_id);
  res.json(rows);
}

function create(req, res) {
  const { title, description, category, duration_minutes, level, thumbnail } = req.body || {};
  if (!title) return res.status(400).json({ error: "Informe o titulo do treinamento." });
  const id = db.prepare(
    `INSERT INTO trainings (company_id, title, description, category, duration_minutes, level, thumbnail, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`
  ).run(
    req.user.company_id, title, description || "", category || "Geral",
    Number(duration_minutes) || 60, level || "Basico",
    thumbnail || "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80"
  ).lastInsertRowid;
  res.status(201).json(db.prepare("SELECT * FROM trainings WHERE id = ?").get(id));
}

function update(req, res) {
  const t = db.prepare("SELECT * FROM trainings WHERE id = ? AND company_id = ?").get(req.params.id, req.user.company_id);
  if (!t) return res.status(404).json({ error: "Treinamento nao encontrado." });
  const { title, description, category, duration_minutes, level, thumbnail, status } = req.body || {};
  db.prepare(
    `UPDATE trainings SET title = COALESCE(?, title), description = COALESCE(?, description),
      category = COALESCE(?, category), duration_minutes = COALESCE(?, duration_minutes),
      level = COALESCE(?, level), thumbnail = COALESCE(?, thumbnail), status = COALESCE(?, status) WHERE id = ?`
  ).run(title || null, description || null, category || null, duration_minutes ?? null, level || null, thumbnail || null, status || null, t.id);
  res.json(db.prepare("SELECT * FROM trainings WHERE id = ?").get(t.id));
}

function remove(req, res) {
  const t = db.prepare("SELECT * FROM trainings WHERE id = ? AND company_id = ?").get(req.params.id, req.user.company_id);
  if (!t) return res.status(404).json({ error: "Treinamento nao encontrado." });
  db.prepare("DELETE FROM trainings WHERE id = ?").run(t.id);
  res.json({ ok: true });
}

module.exports = { trainingPayload, listPublished, getOne, enroll, listCompany, create, update, remove };
