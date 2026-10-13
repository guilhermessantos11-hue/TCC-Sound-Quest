const db = require("../config/database");
const { maybeIssueCertificate, getTaskState } = require("./certificadoController");

function assertTraining(id, companyId) {
  return db.prepare("SELECT * FROM trainings WHERE id = ? AND company_id = ?").get(id, companyId);
}

function assertTask(id, companyId) {
  return db.prepare(
    `SELECT tk.*, t.title AS training_title, t.company_id, m.title AS module_title
     FROM tasks tk
     JOIN trainings t ON t.id = tk.training_id
     LEFT JOIN modules m ON m.id = tk.module_id
     WHERE tk.id = ? AND t.company_id = ?`
  ).get(id, companyId);
}

function countsFor(taskId, trainingId) {
  const enrolled = db.prepare("SELECT COUNT(*) AS n FROM enrollments WHERE training_id = ?").get(trainingId).n;
  const submitted = db.prepare(
    "SELECT COUNT(*) AS n FROM task_submissions WHERE task_id = ? AND status = 'submitted'"
  ).get(taskId).n;
  const approved = db.prepare(
    "SELECT COUNT(*) AS n FROM task_submissions WHERE task_id = ? AND status = 'approved'"
  ).get(taskId).n;
  const rejected = db.prepare(
    "SELECT COUNT(*) AS n FROM task_submissions WHERE task_id = ? AND status = 'rejected'"
  ).get(taskId).n;
  const pending = Math.max(0, enrolled - submitted - approved - rejected);
  return { enrolled, submitted, approved, rejected, pending };
}

function mapTask(row, userId) {
  const counts = countsFor(row.id, row.training_id);
  const submission = userId
    ? db.prepare("SELECT * FROM task_submissions WHERE task_id = ? AND user_id = ?").get(row.id, userId)
    : null;
  return { ...row, ...counts, submission: submission || null };
}

function listCompany(req, res) {
  const trainingId = req.query.training_id;
  const rows = trainingId
    ? db.prepare(
        `SELECT tk.*, t.title AS training_title, m.title AS module_title
         FROM tasks tk JOIN trainings t ON t.id = tk.training_id
         LEFT JOIN modules m ON m.id = tk.module_id
         WHERE t.company_id = ? AND tk.training_id = ?
         ORDER BY tk.due_at IS NULL, tk.due_at, tk.id`
      ).all(req.user.company_id, trainingId)
    : db.prepare(
        `SELECT tk.*, t.title AS training_title, m.title AS module_title
         FROM tasks tk JOIN trainings t ON t.id = tk.training_id
         LEFT JOIN modules m ON m.id = tk.module_id
         WHERE t.company_id = ?
         ORDER BY tk.due_at IS NULL, tk.due_at, tk.id`
      ).all(req.user.company_id);
  res.json(rows.map((r) => mapTask(r)));
}

function getOne(req, res) {
  const task = assertTask(req.params.id, req.user.company_id);
  if (!task) return res.status(404).json({ error: "Tarefa nao encontrada." });
  const submissions = db.prepare(
    `SELECT u.id AS user_id, u.name AS user_name, u.email, u.department,
      s.id AS submission_id, s.answer, s.status, s.result_note, s.submitted_at, s.reviewed_at
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN task_submissions s ON s.task_id = ? AND s.user_id = u.id
     WHERE e.training_id = ?
     ORDER BY u.name`
  ).all(task.id, task.training_id);
  res.json({ ...mapTask(task), submissions });
}

function create(req, res) {
  const { training_id, module_id, title, instructions, due_at, required } = req.body || {};
  if (!training_id || !title) return res.status(400).json({ error: "Informe treinamento e titulo." });
  const training = assertTraining(training_id, req.user.company_id);
  if (!training) return res.status(404).json({ error: "Treinamento nao encontrado." });
  let mid = module_id ? Number(module_id) : null;
  if (mid) {
    const mod = db.prepare("SELECT id FROM modules WHERE id = ? AND training_id = ?").get(mid, training.id);
    if (!mod) return res.status(400).json({ error: "Modulo invalido para este treinamento." });
  } else {
    mid = null;
  }
  const id = db.prepare(
    `INSERT INTO tasks (training_id, module_id, title, instructions, due_at, required, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    training.id,
    mid,
    String(title).trim(),
    instructions || "",
    due_at || null,
    required === false || required === 0 || required === "0" ? 0 : 1,
    req.user.id
  ).lastInsertRowid;
  res.status(201).json(mapTask(assertTask(id, req.user.company_id)));
}

function update(req, res) {
  const task = assertTask(req.params.id, req.user.company_id);
  if (!task) return res.status(404).json({ error: "Tarefa nao encontrada." });
  const { title, instructions, due_at, required, module_id } = req.body || {};
  let mid = module_id === undefined ? task.module_id : (module_id ? Number(module_id) : null);
  if (mid) {
    const mod = db.prepare("SELECT id FROM modules WHERE id = ? AND training_id = ?").get(mid, task.training_id);
    if (!mod) return res.status(400).json({ error: "Modulo invalido para este treinamento." });
  }
  const reqd = required === undefined ? task.required : (required === false || required === 0 || required === "0" ? 0 : 1);
  db.prepare(
    `UPDATE tasks SET title = COALESCE(?, title), instructions = COALESCE(?, instructions),
      due_at = ?, required = ?, module_id = ? WHERE id = ?`
  ).run(title ? String(title).trim() : null, instructions == null ? null : instructions, due_at === undefined ? task.due_at : (due_at || null), reqd, mid, task.id);
  res.json(mapTask(assertTask(task.id, req.user.company_id)));
}

function remove(req, res) {
  const task = assertTask(req.params.id, req.user.company_id);
  if (!task) return res.status(404).json({ error: "Tarefa nao encontrada." });
  db.prepare("DELETE FROM tasks WHERE id = ?").run(task.id);
  res.json({ ok: true });
}

const TASK_BANK = {
  "Seguranca do Trabalho": [
    {
      title: "Checklist visual de protecoes",
      instructions: "No seu posto, liste 4 protecoes visiveis (fixas, moveis, sensores ou emergencia). Descreva o estado de cada uma e o que faria se alguma estivesse ausente."
    },
    {
      title: "Simulacao de bloqueio e etiquetagem",
      instructions: "Descreva, em ordem, os passos de bloqueio (LOTO) que voce aplicaria antes de uma intervencao. Cite como sinalizaria o equipamento para a equipe."
    }
  ],
  "Inclusao e Comunicacao": [
    {
      title: "Painel visual do turno",
      instructions: "Proponha um quadro de inicio de turno com icones para meta, risco e apoio. Explique como um colega surdo confirmaria o entendimento sem audio."
    },
    {
      title: "Sinal combinado da equipe",
      instructions: "Descreva 3 sinais visuais padronizados (partir, pausar, pedir apoio) e onde eles ficariam visiveis na linha."
    }
  ],
  Qualidade: [
    {
      title: "Comparacao com o padrao ouro",
      instructions: "Descreva como voce compara uma peca com o padrao fotografico. Cite 3 desvios visuais que voce sinalizaria no painel de qualidade."
    },
    {
      title: "Registro acessivel de nao conformidade",
      instructions: "Monte um relato curto de nao conformidade usando so evidencias visuais: o que viu, onde registrou e quem avisou."
    }
  ]
};

function templatesFor(training) {
  const byCat = TASK_BANK[training.category] || TASK_BANK[training.category?.split(" ")[0]] || null;
  if (byCat) return byCat;
  return [
    {
      title: "Aplicacao pratica no posto",
      instructions: `Descreva como voce aplicara o treinamento "${training.title}" no seu posto. Cite 3 evidencias visuais que comprovam o entendimento.`
    },
    {
      title: "Melhoria observada na rotina",
      instructions: "Identifique um ponto de risco ou falha de comunicacao na sua rotina e descreva a acao visual que voce adotaria."
    }
  ];
}

function generate(req, res) {
  const training = assertTraining(req.params.id, req.user.company_id);
  if (!training) return res.status(404).json({ error: "Treinamento nao encontrado." });
  const modules = db.prepare("SELECT id, title FROM modules WHERE training_id = ? ORDER BY order_index, id").all(training.id);
  const created = [];
  const insert = db.prepare(
    `INSERT INTO tasks (training_id, module_id, title, instructions, due_at, required, created_by)
     VALUES (?, ?, ?, ?, date('now', '+14 day'), 1, ?)`
  );
  templatesFor(training).forEach((tpl, idx) => {
    const exists = db.prepare("SELECT id FROM tasks WHERE training_id = ? AND title = ?").get(training.id, tpl.title);
    if (exists) return;
    const mid = modules[idx] ? modules[idx].id : (modules[0] ? modules[0].id : null);
    const id = insert.run(training.id, mid, tpl.title, tpl.instructions, req.user.id).lastInsertRowid;
    created.push(mapTask(assertTask(id, req.user.company_id)));
  });
  if (!created.length) {
    return res.status(200).json({ tasks: [], message: "As tarefas deste tema ja existem." });
  }
  res.status(201).json({ tasks: created });
}

function review(req, res) {
  const task = assertTask(req.params.id, req.user.company_id);
  if (!task) return res.status(404).json({ error: "Tarefa nao encontrada." });
  const { user_id, status, result_note } = req.body || {};
  if (!user_id || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Informe o colaborador e o resultado (approved ou rejected)." });
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND company_id = ? AND role = 'collaborator'").get(user_id, req.user.company_id);
  if (!user) return res.status(404).json({ error: "Colaborador nao encontrado." });
  const enrolled = db.prepare("SELECT id FROM enrollments WHERE user_id = ? AND training_id = ?").get(user.id, task.training_id);
  if (!enrolled) return res.status(400).json({ error: "Colaborador nao inscrito neste treinamento." });
  const existing = db.prepare("SELECT * FROM task_submissions WHERE task_id = ? AND user_id = ?").get(task.id, user.id);
  if (!existing || existing.status === "pending") {
    return res.status(400).json({ error: "Nao ha resposta para avaliar." });
  }
  db.prepare(
    `UPDATE task_submissions SET status = ?, result_note = ?, reviewed_at = datetime('now'), reviewed_by = ?
     WHERE task_id = ? AND user_id = ?`
  ).run(status, result_note || "", req.user.id, task.id, user.id);
  const info = maybeIssueCertificate(user.id, task.training_id);
  const submission = db.prepare("SELECT * FROM task_submissions WHERE task_id = ? AND user_id = ?").get(task.id, user.id);
  res.json({ submission, progress: info });
}

function listMine(req, res) {
  const rows = db.prepare(
    `SELECT tk.*, t.title AS training_title, m.title AS module_title
     FROM tasks tk
     JOIN trainings t ON t.id = tk.training_id
     JOIN enrollments e ON e.training_id = t.id AND e.user_id = ?
     LEFT JOIN modules m ON m.id = tk.module_id
     WHERE t.company_id = ?
     ORDER BY tk.due_at IS NULL, tk.due_at, tk.id`
  ).all(req.user.id, req.user.company_id);
  const items = rows.map((r) => {
    const mapped = mapTask(r, req.user.id);
    const status = mapped.submission?.status || "pending";
    return { ...mapped, my_status: status };
  });
  res.json({
    stats: {
      total: items.length,
      pending: items.filter((t) => t.my_status === "pending" || t.my_status === "rejected").length,
      submitted: items.filter((t) => t.my_status === "submitted").length,
      approved: items.filter((t) => t.my_status === "approved").length
    },
    tasks: items
  });
}

function submit(req, res) {
  const task = db.prepare(
    `SELECT tk.*, t.company_id FROM tasks tk JOIN trainings t ON t.id = tk.training_id WHERE tk.id = ?`
  ).get(req.params.id);
  if (!task || task.company_id !== req.user.company_id) {
    return res.status(404).json({ error: "Tarefa nao encontrada." });
  }
  const enrolled = db.prepare("SELECT id FROM enrollments WHERE user_id = ? AND training_id = ?").get(req.user.id, task.training_id);
  if (!enrolled) return res.status(400).json({ error: "Inscreva-se no treinamento para enviar a tarefa." });
  const answer = String((req.body || {}).answer || "").trim();
  if (!answer) return res.status(400).json({ error: "Escreva a resposta da tarefa." });
  const existing = db.prepare("SELECT * FROM task_submissions WHERE task_id = ? AND user_id = ?").get(task.id, req.user.id);
  if (existing && existing.status === "approved") {
    return res.status(400).json({ error: "Esta tarefa ja foi aprovada." });
  }
  if (existing && existing.status === "submitted") {
    return res.status(400).json({ error: "Aguarde a avaliacao da empresa para reenviar." });
  }
  if (existing) {
    db.prepare(
      `UPDATE task_submissions SET answer = ?, status = 'submitted', result_note = NULL,
        submitted_at = datetime('now'), reviewed_at = NULL, reviewed_by = NULL
       WHERE id = ?`
    ).run(answer, existing.id);
  } else {
    db.prepare(
      `INSERT INTO task_submissions (task_id, user_id, answer, status, submitted_at)
       VALUES (?, ?, ?, 'submitted', datetime('now'))`
    ).run(task.id, req.user.id, answer);
  }
  const info = maybeIssueCertificate(req.user.id, task.training_id);
  const submission = db.prepare("SELECT * FROM task_submissions WHERE task_id = ? AND user_id = ?").get(task.id, req.user.id);
  res.json({
    submission,
    progress: info.display,
    completed: info.completed,
    stage: info.stage,
    tasks: getTaskState(req.user.id, task.training_id),
    quizzes: info.quizzes,
    exam: info.exam,
    content: info.content
  });
}

module.exports = { listCompany, getOne, create, update, remove, generate, review, listMine, submit };
