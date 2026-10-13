const db = require("../config/database");
const { maybeIssueCertificate, calcContentProgress } = require("./certificadoController");

function submit(req, res) {
  const activity = db.prepare("SELECT * FROM activities WHERE id = ?").get(req.params.id);
  if (!activity) return res.status(404).json({ error: "Avaliacao nao encontrada." });
  const training = db.prepare("SELECT company_id FROM trainings WHERE id = ?").get(activity.training_id);
  if (!training || training.company_id !== req.user.company_id) {
    return res.status(404).json({ error: "Avaliacao nao encontrada." });
  }
  const kind = activity.kind || "final";
  if (kind === "final") {
    const contentDone = calcContentProgress(req.user.id, activity.training_id);
    if (contentDone < 100) {
      return res.status(400).json({ error: "Conclua todos os conteudos obrigatorios antes da avaliacao final." });
    }
    const pending = db.prepare(
      `SELECT a.id FROM activities a
       WHERE a.training_id = ? AND a.kind = 'module'
         AND NOT EXISTS (
           SELECT 1 FROM attempts t
           WHERE t.user_id = ? AND t.activity_id = a.id AND t.passed = 1
         )`
    ).get(activity.training_id, req.user.id);
    if (pending) {
      return res.status(400).json({ error: "Conclua as atividades de cada modulo antes da avaliacao final." });
    }
    const pendingTask = db.prepare(
      `SELECT tk.id FROM tasks tk
       WHERE tk.training_id = ? AND tk.required = 1
         AND NOT EXISTS (
           SELECT 1 FROM task_submissions s
           WHERE s.task_id = tk.id AND s.user_id = ? AND s.status IN ('submitted', 'approved')
         )`
    ).get(activity.training_id, req.user.id);
    if (pendingTask) {
      return res.status(400).json({ error: "Envie as tarefas obrigatorias do treinamento antes da avaliacao final." });
    }
  } else if (kind === "module") {
    const moduleContents = db.prepare("SELECT id FROM contents WHERE module_id = ?").all(activity.module_id);
    if (moduleContents.length) {
      const done = db.prepare(
        `SELECT COUNT(*) AS n FROM content_progress
         WHERE user_id = ? AND completed = 1 AND content_id IN (${moduleContents.map(() => "?").join(",")})`
      ).get(req.user.id, ...moduleContents.map((c) => c.id)).n;
      if (done < moduleContents.length) {
        return res.status(400).json({ error: "Conclua os conteudos deste modulo antes da atividade." });
      }
    }
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
    kind,
    module_id: activity.module_id,
    certificate,
    progress: info.display,
    completed: info.completed,
    stage: info.stage,
    exam: info.exam,
    quizzes: info.quizzes,
    tasks: info.tasks
  });
}

function checkAnswer(req, res) {
  const activity = db.prepare("SELECT * FROM activities WHERE id = ?").get(req.params.id);
  if (!activity) return res.status(404).json({ error: "Avaliacao nao encontrada." });
  const training = db.prepare("SELECT company_id FROM trainings WHERE id = ?").get(activity.training_id);
  if (!training || training.company_id !== req.user.company_id) {
    return res.status(404).json({ error: "Avaliacao nao encontrada." });
  }
  const questionId = Number((req.body || {}).question_id);
  const optionId = Number((req.body || {}).option_id);
  const question = db.prepare("SELECT * FROM questions WHERE id = ? AND activity_id = ?").get(questionId, activity.id);
  if (!question) return res.status(400).json({ error: "Pergunta invalida." });
  const option = db.prepare("SELECT * FROM options WHERE id = ? AND question_id = ?").get(optionId, question.id);
  if (!option) return res.status(400).json({ error: "Alternativa invalida." });
  const correct = db.prepare("SELECT id FROM options WHERE question_id = ? AND is_correct = 1").get(question.id);
  res.json({
    correct: !!option.is_correct,
    selected_id: option.id,
    correct_id: correct ? correct.id : null
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
     LEFT JOIN activities ac ON ac.training_id = t.id AND (ac.kind = 'final' OR ac.kind IS NULL) AND ac.module_id IS NULL
     WHERE e.user_id = ?
     ORDER BY t.title`
  ).all(req.user.id, req.user.id, req.user.id);
  res.json({ attempts: rows, trainings });
}

function saveActivity(req, res) {
  const t = db.prepare("SELECT * FROM trainings WHERE id = ? AND company_id = ?").get(req.params.id, req.user.company_id);
  if (!t) return res.status(404).json({ error: "Treinamento nao encontrado." });
  const { title, description, passing_score, questions, module_id, kind } = req.body || {};
  if (!title) return res.status(400).json({ error: "Informe o titulo da avaliacao." });
  const activityKind = kind === "module" ? "module" : "final";
  const moduleId = activityKind === "module" ? Number(module_id) || null : null;
  if (activityKind === "module" && !moduleId) {
    return res.status(400).json({ error: "Informe o modulo da atividade." });
  }
  const existing = activityKind === "module"
    ? db.prepare("SELECT id FROM activities WHERE training_id = ? AND module_id = ? AND kind = 'module'").get(t.id, moduleId)
    : db.prepare("SELECT id FROM activities WHERE training_id = ? AND (kind = 'final' OR kind IS NULL) AND module_id IS NULL").get(t.id);
  let activityId;
  if (existing) {
    db.prepare("UPDATE activities SET title = ?, description = ?, passing_score = ?, kind = ?, module_id = ? WHERE id = ?").run(title, description || "", Number(passing_score) || 70, activityKind, moduleId, existing.id);
    db.prepare("DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE activity_id = ?)").run(existing.id);
    db.prepare("DELETE FROM questions WHERE activity_id = ?").run(existing.id);
    activityId = existing.id;
  } else {
    activityId = db.prepare("INSERT INTO activities (training_id, module_id, kind, title, description, passing_score) VALUES (?, ?, ?, ?, ?, ?)").run(t.id, moduleId, activityKind, title, description || "", Number(passing_score) || 70).lastInsertRowid;
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

module.exports = { submit, checkAnswer, saveActivity, attempts, myAttempts };
