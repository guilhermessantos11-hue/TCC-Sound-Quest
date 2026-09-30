const jwt = require("jsonwebtoken");
const db = require("./db");

const SECRET = process.env.JWT_SECRET || "soundquest-corporate-secret";

function sign(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      company_id: user.company_id,
      name: user.name,
      email: user.email
    },
    SECRET,
    { expiresIn: "7d" }
  );
}

function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Sessao expirada. Faca login novamente." });
    }
    try {
      const payload = jwt.verify(token, SECRET);
      const user = db.prepare("SELECT * FROM users WHERE id = ? AND status = 'active'").get(payload.id);
      if (!user) {
        return res.status(401).json({ error: "Usuario inativo ou nao encontrado." });
      }
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

module.exports = { sign, auth, publicUser };
