const db = require("../config/database");

function calcContentProgress(userId, trainingId) {
  const total = db
    .prepare(
      `SELECT COUNT(*) AS n FROM contents c JOIN modules m ON m.id = c.module_id WHERE m.training_id = ?`
    )
    .get(trainingId).n;
  if (!total) return 100;
  const done = db
    .prepare(
      `SELECT COUNT(*) AS n FROM content_progress cp
       JOIN contents c ON c.id = cp.content_id
       JOIN modules m ON m.id = c.module_id
       WHERE cp.user_id = ? AND m.training_id = ? AND cp.completed = 1`
    )
    .get(userId, trainingId).n;
  return Math.round((done / total) * 100);
}

function getExamState(userId, trainingId) {
  const activity = db.prepare("SELECT id, passing_score FROM activities WHERE training_id = ?").get(trainingId);
  if (!activity) {
    return { hasExam: false, passed: true, bestScore: null, passing_score: null, activity_id: null };
  }
  const best = db
    .prepare("SELECT MAX(score) AS score FROM attempts WHERE user_id = ? AND activity_id = ?")
    .get(userId, activity.id);
  const bestScore = best && best.score != null ? best.score : null;
  return {
    hasExam: true,
    passed: (bestScore || 0) >= activity.passing_score,
    bestScore,
    passing_score: activity.passing_score,
    activity_id: activity.id
  };
}

function overallProgress(userId, trainingId) {
  const content = calcContentProgress(userId, trainingId);
  const exam = getExamState(userId, trainingId);
  let display = content;
  let completed = false;
  let stage = "modules";
  if (!exam.hasExam) {
    completed = content >= 100;
    display = content;
    stage = completed ? "done" : "modules";
  } else if (content < 100) {
    display = content;
    stage = "modules";
  } else if (!exam.passed) {
    display = 90;
    stage = "exam";
  } else {
    display = 100;
    completed = true;
    stage = "done";
  }
  return { content, display, completed, stage, exam };
}

function maybeIssueCertificate(userId, trainingId) {
  const info = overallProgress(userId, trainingId);
  const status = info.completed ? "completed" : "in_progress";
  db.prepare(
    "UPDATE enrollments SET progress = ?, status = ?, completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END WHERE user_id = ? AND training_id = ?"
  ).run(info.display, status, status, userId, trainingId);
  if (info.completed) {
    const existing = db.prepare("SELECT * FROM certificates WHERE user_id = ? AND training_id = ?").get(userId, trainingId);
    if (!existing) {
      const code = `SQ-${String(trainingId).padStart(3, "0")}-${String(userId).padStart(3, "0")}-${Date.now().toString(36).toUpperCase()}`;
      db.prepare("INSERT INTO certificates (user_id, training_id, code) VALUES (?, ?, ?)").run(userId, trainingId, code);
    }
  }
  return info;
}

function certSelect() {
  return `SELECT c.*, u.name AS user_name, u.email, t.title, t.category, t.duration_minutes,
    t.level, co.name AS company_name
    FROM certificates c
    JOIN users u ON u.id = c.user_id
    JOIN trainings t ON t.id = c.training_id
    JOIN companies co ON co.id = t.company_id`;
}

function list(req, res) {
  const rows =
    req.user.role === "company"
      ? db.prepare(`${certSelect()} WHERE t.company_id = ? ORDER BY c.issued_at DESC`).all(req.user.company_id)
      : db.prepare(`${certSelect()} WHERE c.user_id = ? ORDER BY c.issued_at DESC`).all(req.user.id);
  res.json(rows);
}

function getOne(req, res) {
  const cert = db.prepare(`${certSelect()} WHERE c.id = ?`).get(req.params.id);
  if (!cert) return res.status(404).json({ error: "Certificado nao encontrado." });
  if (req.user.role !== "company" && cert.user_id !== req.user.id) {
    return res.status(403).json({ error: "Acesso negado." });
  }
  res.json(cert);
}

module.exports = {
  calcProgress: calcContentProgress,
  calcContentProgress,
  getExamState,
  overallProgress,
  maybeIssueCertificate,
  list,
  getOne
};
