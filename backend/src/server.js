const express = require("express");
const cors = require("cors");
const path = require("path");
require("../config/database");
const { seed } = require("./seed");

seed();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "SOUND QUEST API" }));

app.use("/api", require("../routes/authRoutes"));
app.use("/api", require("../routes/funcionarioRoutes"));
app.use("/api", require("../routes/treinamentoRoutes"));
app.use("/api", require("../routes/moduloRoutes"));
app.use("/api", require("../routes/avaliacaoRoutes"));
app.use("/api", require("../routes/tarefaRoutes"));
app.use("/api", require("../routes/certificadoRoutes"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`SOUND QUEST API on ${PORT}`);
});
