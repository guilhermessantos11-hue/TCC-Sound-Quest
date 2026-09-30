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
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }
  if (user.status !== "active") return res.status(403).json({ error: "Conta inativa. Contate o administrador." });
  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(user.company_id);
  res.json({ token: sign(user), user: publicUser(user), company });
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

module.exports = { sign, auth, publicUser, login, register, me, updateMe };
