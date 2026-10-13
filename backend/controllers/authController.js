const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const SECRET = process.env.JWT_SECRET || "soundquest-corporate-secret";

function sign(user) {
  return jwt.sign(
    { id: user.id, role: user.role, company_id: user.company_id, name: user.name, email: user.email },
    SECRET,
    { expiresIn: "7d" }
  );
}

function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Sessao expirada. Faca login novamente." });
    try {
      const payload = jwt.verify(token, SECRET);
      const user = db.prepare("SELECT * FROM users WHERE id = ? AND status = 'active'").get(payload.id);
      if (!user) return res.status(401).json({ error: "Usuario inativo ou nao encontrado." });
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ error: "Acesso nao autorizado para este perfil." });
      }
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: "Token invalido. Faca login novamente." });
    }
  };
}

function publicUser(user) {
  return {
    id: user.id,
    company_id: user.company_id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    position: user.position,
    phone: user.phone,
    accessibility_prefs: JSON.parse(user.accessibility_prefs || "{}"),
    status: user.status
  };
}

function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Informe e-mail e senha." });
  const emailNorm = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return res.status(400).json({ error: "Informe um e-mail valido." });
  }
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(emailNorm);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }
  if (user.status !== "active") return res.status(403).json({ error: "Conta inativa. Contate o administrador." });
  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(user.company_id);
  res.json({ token: sign(user), user: publicUser(user), company });
}

function forgotPassword(req, res) {
  const emailNorm = String((req.body || {}).email || "").trim().toLowerCase();
  if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return res.status(400).json({ error: "Informe um e-mail valido." });
  }
  const generic = {
    message: "Se o e-mail estiver cadastrado, enviaremos as instrucoes para redefinir a senha."
  };
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND status = 'active'").get(emailNorm);
  if (!user) return res.json(generic);

  db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL").run(user.id);

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
  db.prepare("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)").run(
    user.id,
    tokenHash,
    expiresAt
  );

  const payload = { ...generic, reset_path: `/#/redefinir-senha?token=${token}` };
  if (process.env.NODE_ENV !== "production") payload.reset_token = token;
  res.json(payload);
}

function resetPassword(req, res) {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: "Informe o codigo e a nova senha." });
  if (String(password).length < 6) return res.status(400).json({ error: "A senha deve ter no minimo 6 caracteres." });

  const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
  const row = db
    .prepare(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND datetime(expires_at) > datetime('now')`
    )
    .get(tokenHash);
  if (!row) return res.status(400).json({ error: "Link de recuperacao invalido ou expirado." });

  const user = db.prepare("SELECT * FROM users WHERE id = ? AND status = 'active'").get(row.user_id);
  if (!user) return res.status(400).json({ error: "Link de recuperacao invalido ou expirado." });

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(String(password), 10), user.id);
  db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?").run(row.id);
  db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL").run(user.id);
  res.json({ message: "Senha redefinida com sucesso. Faca login com a nova senha." });
}

function register(req, res) {
  const { name, email, password, role, company_name, department, position } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Preencha nome, e-mail e senha." });
  if (password.length < 6) return res.status(400).json({ error: "A senha deve ter no minimo 6 caracteres." });
  const emailNorm = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) return res.status(400).json({ error: "E-mail invalido." });
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(emailNorm)) {
    return res.status(409).json({ error: "Este e-mail ja esta cadastrado." });
  }
  const userRole = role === "company" ? "company" : "collaborator";
  let companyId;
  if (userRole === "company") {
    if (!company_name) return res.status(400).json({ error: "Informe o nome da empresa." });
    companyId = db.prepare("INSERT INTO companies (name) VALUES (?)").run(company_name).lastInsertRowid;
  } else {
    const first = db.prepare("SELECT id FROM companies ORDER BY id LIMIT 1").get();
    if (!first) return res.status(400).json({ error: "Nenhuma empresa disponivel para vinculo." });
    companyId = first.id;
  }
  const id = db
    .prepare(
      `INSERT INTO users (company_id, name, email, password_hash, role, department, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(companyId, name.trim(), emailNorm, bcrypt.hashSync(password, 10), userRole, department || null, position || null)
    .lastInsertRowid;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(companyId);
  res.status(201).json({ token: sign(user), user: publicUser(user), company });
}

function me(req, res) {
  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.user.company_id);
  res.json({ user: publicUser(req.user), company });
}

function updateMe(req, res) {
  const { name, phone, department, position, accessibility_prefs } = req.body || {};
  db.prepare(
    `UPDATE users SET
      name = COALESCE(?, name), phone = COALESCE(?, phone),
      department = COALESCE(?, department), position = COALESCE(?, position),
      accessibility_prefs = COALESCE(?, accessibility_prefs)
     WHERE id = ?`
  ).run(
    name || null,
    phone || null,
    department || null,
    position || null,
    accessibility_prefs ? JSON.stringify(accessibility_prefs) : null,
    req.user.id
  );
  res.json({ user: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id)) });
}

module.exports = { sign, auth, publicUser, login, register, me, updateMe, forgotPassword, resetPassword };
