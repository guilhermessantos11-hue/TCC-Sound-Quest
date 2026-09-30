const db = require("../config/database");
const { maybeIssueCertificate } = require("./certificadoController");

function createModule(req, res) {
  const t = db.prepare("SELECT * FROM trainings WHERE id = ? AND company_id = ?").get(req.params.id, req.user.company_id);
  if (!t) return res.status(404).json({ error: "Treinamento nao encontrado." });
  const { title, description } = req.body || {};
  if (!title) return res.status(400).json({ error: "Informe o titulo do modulo." });
  const order = db.prepare("SELECT COUNT(*) AS n FROM modules WHERE training_id = ?").get(t.id).n;
  const id = db.prepare("INSERT INTO modules (training_id, title, description, order_index) VALUES (?, ?, ?, ?)").run(t.id, title, description || "", order).lastInsertRowid;
  res.status(201).json(db.prepare("SELECT * FROM modules WHERE id = ?").get(id));
}

function updateModule(req, res) {
  const m = db.prepare(`SELECT m.* FROM modules m JOIN trainings t ON t.id = m.training_id WHERE m.id = ? AND t.company_id = ?`).get(req.params.id, req.user.company_id);
  if (!m) return res.status(404).json({ error: "Modulo nao encontrado." });
  const { title, description } = req.body || {};
  db.prepare("UPDATE modules SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ?").run(title || null, description || null, m.id);
  res.json(db.prepare("SELECT * FROM modules WHERE id = ?").get(m.id));
}

function removeModule(req, res) {
  const m = db.prepare(`SELECT m.* FROM modules m JOIN trainings t ON t.id = m.training_id WHERE m.id = ? AND t.company_id = ?`).get(req.params.id, req.user.company_id);
  if (!m) return res.status(404).json({ error: "Modulo nao encontrado." });
  db.prepare("DELETE FROM modules WHERE id = ?").run(m.id);
  res.json({ ok: true });
}

function createContent(req, res) {
  const m = db.prepare(`SELECT m.* FROM modules m JOIN trainings t ON t.id = m.training_id WHERE m.id = ? AND t.company_id = ?`).get(req.params.id, req.user.company_id);
  if (!m) return res.status(404).json({ error: "Modulo nao encontrado." });
  const { title, type, body, media_url, captions, libras_notes } = req.body || {};
  if (!title || !type) return res.status(400).json({ error: "Titulo e tipo sao obrigatorios." });
  if (!["text", "image", "libras"].includes(type)) return res.status(400).json({ error: "Tipo de conteudo invalido." });
  const order = db.prepare("SELECT COUNT(*) AS n FROM contents WHERE module_id = ?").get(m.id).n;
  const id = db.prepare(
    `INSERT INTO contents (module_id, title, type, body, media_url, captions, libras_notes, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(m.id, title, type, body || "", media_url || null, captions || null, libras_notes || null, order).lastInsertRowid;
  res.status(201).json(db.prepare("SELECT * FROM contents WHERE id = ?").get(id));
}

function updateContent(req, res) {
  const c = db.prepare(
    `SELECT c.* FROM contents c JOIN modules m ON m.id = c.module_id JOIN trainings t ON t.id = m.training_id
     WHERE c.id = ? AND t.company_id = ?`
  ).get(req.params.id, req.user.company_id);
  if (!c) return res.status(404).json({ error: "Conteudo nao encontrado." });
  const { title, type, body, media_url, captions, libras_notes } = req.body || {};
  db.prepare(
    `UPDATE contents SET title = COALESCE(?, title), type = COALESCE(?, type), body = COALESCE(?, body),
      media_url = COALESCE(?, media_url), captions = COALESCE(?, captions), libras_notes = COALESCE(?, libras_notes) WHERE id = ?`
  ).run(title || null, type || null, body || null, media_url || null, captions || null, libras_notes || null, c.id);
  res.json(db.prepare("SELECT * FROM contents WHERE id = ?").get(c.id));
}

function removeContent(req, res) {
  const c = db.prepare(
    `SELECT c.* FROM contents c JOIN modules m ON m.id = c.module_id JOIN trainings t ON t.id = m.training_id
     WHERE c.id = ? AND t.company_id = ?`
  ).get(req.params.id, req.user.company_id);
  if (!c) return res.status(404).json({ error: "Conteudo nao encontrado." });
  db.prepare("DELETE FROM contents WHERE id = ?").run(c.id);
  res.json({ ok: true });
}

function completeContent(req, res) {
  const content = db.prepare(`SELECT c.*, m.training_id FROM contents c JOIN modules m ON m.id = c.module_id WHERE c.id = ?`).get(req.params.id);
  if (!content) return res.status(404).json({ error: "Conteudo nao encontrado." });
  const enrolled = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND training_id = ?").get(req.user.id, content.training_id);
  if (!enrolled) return res.status(400).json({ error: "Inscreva-se no treinamento primeiro." });
  db.prepare(
    `INSERT INTO content_progress (user_id, content_id, completed, completed_at)
     VALUES (?, ?, 1, datetime('now'))
     ON CONFLICT(user_id, content_id) DO UPDATE SET completed = 1, completed_at = datetime('now')`
  ).run(req.user.id, content.id);
  const info = maybeIssueCertificate(req.user.id, content.training_id);
  res.json({ ok: true, progress: info.display, ...info });
}

module.exports = { createModule, updateModule, removeModule, createContent, updateContent, removeContent, completeContent };
