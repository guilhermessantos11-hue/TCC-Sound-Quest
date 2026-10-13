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

function activityBest(userId, activityId, passingScore) {
  const best = db
    .prepare("SELECT MAX(score) AS score FROM attempts WHERE user_id = ? AND activity_id = ?")
    .get(userId, activityId);
  const bestScore = best && best.score != null ? best.score : null;
  return {
    bestScore,
    passed: bestScore != null && bestScore >= (passingScore || 70)
  };
}

function getModuleQuizState(userId, trainingId) {
  const quizzes = db
    .prepare("SELECT id, module_id, passing_score, title FROM activities WHERE training_id = ? AND kind = 'module'")
    .all(trainingId);
  const byModule = {};
  let passedCount = 0;
  quizzes.forEach((q) => {
    const best = activityBest(userId, q.id, q.passing_score);
    byModule[q.module_id] = { ...q, ...best };
    if (best.passed) passedCount += 1;
  });
  return {
    total: quizzes.length,
    passed: passedCount,
    allPassed: quizzes.length === 0 || passedCount === quizzes.length,
    byModule
  };
}

function getExamState(userId, trainingId) {
  const activity = db
    .prepare("SELECT id, passing_score FROM activities WHERE training_id = ? AND (kind = 'final' OR kind IS NULL) AND module_id IS NULL")
    .get(trainingId);
  if (!activity) {
    return { hasExam: false, passed: true, bestScore: null, passing_score: null, activity_id: null };
  }
  const best = activityBest(userId, activity.id, activity.passing_score);
  return {
    hasExam: true,
    passed: best.passed,
    bestScore: best.bestScore,
    passing_score: activity.passing_score,
    activity_id: activity.id
  };
}

function getTaskState(userId, trainingId) {
  const tasks = db.prepare("SELECT id, title, required, due_at, module_id FROM tasks WHERE training_id = ?").all(trainingId);
  const byId = {};
  let required = 0;
  let approved = 0;
  let submitted = 0;
  tasks.forEach((t) => {
    const sub = db.prepare("SELECT status, result_note FROM task_submissions WHERE task_id = ? AND user_id = ?").get(t.id, userId);
    const status = sub ? sub.status : "pending";
    byId[t.id] = { ...t, status, result_note: sub ? sub.result_note : null };
    if (!t.required) return;
    required += 1;
    if (status === "approved") approved += 1;
    if (status === "submitted" || status === "approved") submitted += 1;
  });
  return {
    total: tasks.length,
    required,
    approved,
    submitted,
    allSubmitted: required === 0 || submitted === required,
    allApproved: required === 0 || approved === required,
    byId
  };
}

function overallProgress(userId, trainingId) {
  const content = calcContentProgress(userId, trainingId);
  const quizzes = getModuleQuizState(userId, trainingId);
  const tasks = getTaskState(userId, trainingId);
  const exam = getExamState(userId, trainingId);
  const quizShare = quizzes.total ? Math.round((quizzes.passed / quizzes.total) * 100) : 100;
  const taskShare = tasks.required ? Math.round((tasks.approved / tasks.required) * 100) : 100;
  let display = content;
  let completed = false;
  let stage = "modules";
  if (content < 100 || !quizzes.allPassed) {
    display = quizzes.total ? Math.round(content * 0.65 + quizShare * 0.2) : content;
    if (display >= 88) display = 87;
    stage = content < 100 ? "modules" : "quizzes";
  } else if (!tasks.allSubmitted) {
    display = Math.min(89, 80 + Math.round(taskShare * 0.1));
    stage = "tasks";
  } else if (exam.hasExam && !exam.passed) {
    display = 92;
    stage = "exam";
  } else if (!tasks.allApproved) {
    display = 96;
    stage = "tasks";
  } else {
    display = 100;
    completed = true;
    stage = "done";
  }
  if (!exam.hasExam && content >= 100 && quizzes.allPassed && tasks.allApproved) {
    display = 100;
    completed = true;
    stage = "done";
  }
  return { content, display, completed, stage, exam, quizzes, tasks };
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
  if (req.user.role === "company" && cert.company_name) {
    const training = db.prepare("SELECT company_id FROM trainings WHERE id = ?").get(cert.training_id);
    if (!training || training.company_id !== req.user.company_id) {
      return res.status(403).json({ error: "Acesso negado." });
    }
  }
  res.json(cert);
}

module.exports = {
  calcProgress: calcContentProgress,
  calcContentProgress,
  getExamState,
  getModuleQuizState,
  getTaskState,
  overallProgress,
  maybeIssueCertificate,
  list,
  getOne
};
