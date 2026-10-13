import "./styles.css";
import "./theme.css";
import { mountToolbar, setLibras } from "./a11y.js";
import { signalsView } from "./sinais.js";
import { unmountInterprete } from "./interprete.js";
import { figureFor } from "./figures.js";
import { api, setSession, clearSession, getUser, getCompany } from "./api.js";

const app = document.getElementById("app");
const state = {
  user: getUser(),
  company: getCompany(),
  route: location.hash.replace("#", "") || "/",
  data: {},
  a11y: JSON.parse(localStorage.getItem("sq_a11y") || '{"contrast":false,"font":16,"libras":true,"captions":true}')
};

applyA11y();
mountToolbar(state, applyA11y);

window.addEventListener("hashchange", () => {
  state.route = location.hash.replace("#", "") || "/";
  render();
});

function go(path) {
  location.hash = path;
}

function applyA11y() {
  document.body.classList.toggle("hc", !!state.a11y.contrast);
  document.documentElement.style.setProperty("--fs", `${state.a11y.font}px`);
  document.body.classList.toggle("rm", !!state.a11y.motion);
  setLibras(!!state.a11y.libras);
  window.sqRefreshBar?.();
  localStorage.setItem("sq_a11y", JSON.stringify(state.a11y));
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d.replace(" ", "T")).toLocaleDateString("pt-BR");
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function a11yBar() {
  return "";
}

window.sqA11y = (action) => {
  if (action === "contrast") state.a11y.contrast = !state.a11y.contrast;
  if (action === "plus") state.a11y.font = Math.min(22, state.a11y.font + 1);
  if (action === "minus") state.a11y.font = Math.max(14, state.a11y.font - 1);
  applyA11y();
};

function logo(variant = "dark") {
  const src = variant === "light" ? "/brand/logo-light.svg?v=green2" : "/brand/logo.svg?v=green2";
  return `<a class="brand" href="#/" aria-label="SOUND QUEST"><img class="brand-logo" src="${src}" alt="SOUND QUEST" /></a>`;
}

function logoMark(size = "md") {
  return `<img class="brand-mark brand-mark-${size}" src="/brand/logo-mark.svg?v=green2" alt="SOUND QUEST" />`;
}

async function render() {
  unmountInterprete();
  const route = state.route;
  if (!state.user && route.startsWith("/app")) {
    go("/login");
    return;
  }
  if ((route === "/" || route === "") && state.user) {
    go("/app/dashboard");
    return;
  }
  if (route === "/" || route === "" || route.startsWith("/login")) return renderAuth("login");
  if (route.startsWith("/cadastro")) return renderAuth("register");
  if (route.startsWith("/recuperar-senha")) return renderForgot();
  if (route.startsWith("/redefinir-senha")) return renderReset();
  if (route.startsWith("/app")) return renderApp();
  renderAuth("login");
}

function dashboardFor(user) {
  return "/app/dashboard";
}

function renderAuth(mode) {
  const isLogin = mode === "login";
  app.innerHTML = `
    <div class="auth-wrap">
      <aside class="auth-side" style="background:linear-gradient(165deg,#0b5c3a,#0f7a4a 60%,#16a34a);color:#fff">
        ${logo("light")}
        <p class="kicker" style="color:#bbf7d0;margin-top:28px">Acesso corporativo</p>
        <h1 style="color:#fff;margin-top:8px">Capacitacao industrial acessivel.</h1>
        <p>Entre com o e-mail e a senha da sua conta. Colaboradores e gestores usam a mesma tela de login.</p>
        <ul class="auth-points">
          <li>Login unificado por e-mail</li>
          <li>Redirecionamento automatico ao painel do seu perfil</li>
          <li>Recuperacao de senha segura</li>
        </ul>
      </aside>
      <div class="auth-form">
        <form class="form card auth-card" id="auth-form" novalidate>
          <h2>${isLogin ? "Entrar" : "Criar conta"}</h2>
          <p>${isLogin ? "Use o e-mail cadastrado, seja colaborador ou gestor." : "Cadastre uma nova conta corporativa."}</p>
          ${isLogin ? "" : `
            <label for="auth-name">Nome completo</label>
            <input id="auth-name" name="name" required autocomplete="name" />
            <label for="auth-role">Perfil</label>
            <select id="auth-role" name="role">
              <option value="collaborator">Colaborador</option>
              <option value="company">Empresa</option>
            </select>
            <label for="auth-company">Empresa (se for gestor)</label>
            <input id="auth-company" name="company_name" placeholder="Nordeste Industrial S.A." />
            <label for="auth-dept">Area / cargo</label>
            <input id="auth-dept" name="department" placeholder="Producao" />
            <input id="auth-position" name="position" placeholder="Operador" style="margin-top:8px" />
          `}
          <label for="auth-email">E-mail</label>
          <input id="auth-email" type="email" name="email" required autocomplete="username" placeholder="nome@empresa.com" />
          <label for="auth-password">Senha</label>
          <input id="auth-password" type="password" name="password" required minlength="6" autocomplete="${isLogin ? "current-password" : "new-password"}" />
          ${isLogin ? `<div class="auth-forgot"><a href="#/recuperar-senha">Esqueceu a senha?</a></div>` : ""}
          <div id="auth-error" role="alert" aria-live="polite"></div>
          <button class="btn btn-primary" style="width:100%;margin-top:16px;background:#0f7a4a;color:#fff;border:0" type="submit">${isLogin ? "Entrar" : "Cadastrar"}</button>
          <p style="margin-top:14px">${isLogin ? 'Nao tem conta? <a href="#/cadastro">Cadastre-se</a>' : 'Ja possui acesso? <a href="#/login">Entrar</a>'}</p>
        </form>
      </div>
    </div>
    ${a11yBar()}
  `;
  document.getElementById("auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    const box = document.getElementById("auth-error");
    const btn = e.target.querySelector('button[type="submit"]');
    box.innerHTML = "";
    if (!payload.email || !payload.password) {
      box.innerHTML = `<div class="error">Informe e-mail e senha.</div>`;
      return;
    }
    btn.disabled = true;
    try {
      const data = await api(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSession(data.token, data.user, data.company);
      state.user = data.user;
      state.company = data.company;
      go(dashboardFor(data.user));
    } catch (err) {
      box.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
    }
  };
}

function renderForgot() {
  app.innerHTML = `
    <div class="auth-wrap">
      <aside class="auth-side" style="background:linear-gradient(165deg,#0b5c3a,#0f7a4a 60%,#16a34a);color:#fff">
        ${logo("light")}
        <p class="kicker" style="color:#bbf7d0;margin-top:28px">Recuperacao segura</p>
        <h1 style="color:#fff;margin-top:8px">Redefina o acesso com seguranca.</h1>
        <p>Enviamos um link de uso unico, valido por 1 hora. O e-mail nao e confirmado publicamente para proteger as contas.</p>
      </aside>
      <div class="auth-form">
        <form class="form card auth-card" id="forgot-form" novalidate>
          <h2>Esqueceu a senha?</h2>
          <p>Informe o e-mail cadastrado para iniciar a recuperacao.</p>
          <label for="forgot-email">E-mail</label>
          <input id="forgot-email" type="email" name="email" required autocomplete="username" placeholder="nome@empresa.com" />
          <div id="auth-error" role="alert" aria-live="polite"></div>
          <button class="btn btn-primary" style="width:100%;margin-top:16px;background:#0f7a4a;color:#fff;border:0" type="submit">Enviar instrucoes</button>
          <p style="margin-top:14px"><a href="#/login">Voltar ao login</a></p>
        </form>
      </div>
    </div>
    ${a11yBar()}
  `;
  document.getElementById("forgot-form").onsubmit = async (e) => {
    e.preventDefault();
    const email = new FormData(e.target).get("email");
    const box = document.getElementById("auth-error");
    const btn = e.target.querySelector('button[type="submit"]');
    box.innerHTML = "";
    if (!email) {
      box.innerHTML = `<div class="error">Informe um e-mail valido.</div>`;
      return;
    }
    btn.disabled = true;
    try {
      const data = await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      const extra = data.reset_path
        ? `<p class="auth-reset-link">Ambiente de demonstracao: <a href="${escapeHtml(data.reset_path)}">abrir link de redefinicao</a></p>`
        : "";
      box.innerHTML = `<div class="okmsg">${escapeHtml(data.message)}${extra}</div>`;
    } catch (err) {
      box.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
    }
  };
}

function renderReset() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const token = params.get("token") || "";
  app.innerHTML = `
    <div class="auth-wrap">
      <aside class="auth-side" style="background:linear-gradient(165deg,#0b5c3a,#0f7a4a 60%,#16a34a);color:#fff">
        ${logo("light")}
        <p class="kicker" style="color:#bbf7d0;margin-top:28px">Nova senha</p>
        <h1 style="color:#fff;margin-top:8px">Defina uma senha nova.</h1>
        <p>O codigo de recuperacao e de uso unico e expira em 1 hora.</p>
      </aside>
      <div class="auth-form">
        <form class="form card auth-card" id="reset-form" novalidate>
          <h2>Redefinir senha</h2>
          <p>Escolha uma nova senha com no minimo 6 caracteres.</p>
          <input type="hidden" name="token" value="${escapeHtml(token)}" />
          ${token ? "" : `
            <label for="reset-token">Codigo de recuperacao</label>
            <input id="reset-token" name="token_input" required autocomplete="off" />
          `}
          <label for="reset-password">Nova senha</label>
          <input id="reset-password" type="password" name="password" required minlength="6" autocomplete="new-password" />
          <label for="reset-password2">Confirmar senha</label>
          <input id="reset-password2" type="password" name="password2" required minlength="6" autocomplete="new-password" />
          <div id="auth-error" role="alert" aria-live="polite"></div>
          <button class="btn btn-primary" style="width:100%;margin-top:16px;background:#0f7a4a;color:#fff;border:0" type="submit">Salvar nova senha</button>
          <p style="margin-top:14px"><a href="#/login">Voltar ao login</a></p>
        </form>
      </div>
    </div>
    ${a11yBar()}
  `;
  document.getElementById("reset-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tokenValue = fd.get("token") || fd.get("token_input");
    const password = fd.get("password");
    const password2 = fd.get("password2");
    const box = document.getElementById("auth-error");
    const btn = e.target.querySelector('button[type="submit"]');
    box.innerHTML = "";
    if (!tokenValue) {
      box.innerHTML = `<div class="error">Codigo de recuperacao ausente ou invalido.</div>`;
      return;
    }
    if (!password || String(password).length < 6) {
      box.innerHTML = `<div class="error">A senha deve ter no minimo 6 caracteres.</div>`;
      return;
    }
    if (password !== password2) {
      box.innerHTML = `<div class="error">As senhas nao coincidem.</div>`;
      return;
    }
    btn.disabled = true;
    try {
      const data = await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: tokenValue, password })
      });
      box.innerHTML = `<div class="okmsg">${escapeHtml(data.message)}</div>`;
      setTimeout(() => go("/login"), 1200);
    } catch (err) {
      box.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
    }
  };
}

async function renderApp() {
  unmountInterprete();
  const user = state.user;
  const parts = state.route.split("/").filter(Boolean);
  const page = parts[1] || "dashboard";
  const sub = parts[2];
  const isCompany = user.role === "company";
  const nav = isCompany
    ? [
        ["dashboard", "Dashboard"],
        ["sinais", "Sinais da fábrica"],
        ["colaboradores", "Funcionários"],
        ["treinamentos", "Treinamentos"],
        ["tarefas", "Tarefas"],
        ["progresso", "Acompanhamento"],
        ["avaliacoes", "Resultados"],
        ["certificados", "Certificados"],
        ["relatorios", "Relatórios"],
        ["acessibilidade", "Acessibilidade"],
        ["perfil", "Perfil"]
      ]
    : [
        ["dashboard", "Dashboard"],
        ["sinais", "Sinais da fábrica"],
        ["meus", "Meus treinamentos"],
        ["tarefas", "Tarefas"],
        ["avaliacoes", "Avaliações"],
        ["certificados", "Certificados"],
        ["acessibilidade", "Acessibilidade"],
        ["perfil", "Meu perfil"]
      ];
  const pageTitle = nav.find((n) => n[0] === page)?.[1] || (page === "curso" ? "Treinamento" : "SOUND QUEST");

  app.innerHTML = `
    <button type="button" class="skip" onclick="document.getElementById('conteudo').focus()">Ir para o conteúdo</button>
    <div class="app-shell ${isCompany ? "shell-company" : "shell-collab"}">
      <aside class="sidebar" id="sidebar">
        ${logo("light")}
        <p style="opacity:.8;font-size:.85rem;margin:12px 8px 18px">${escapeHtml(state.company?.name || "Empresa")}</p>
        <div class="side-role">${isCompany ? "Gestão empresarial" : "Área do colaborador"}</div>
        <nav class="side-nav">
          ${nav.map(([k, l]) => `<a class="${page === k ? "active" : ""}" ${page === k ? 'aria-current="page"' : ""} href="#/app/${k}">${l}</a>`).join("")}
          <button id="logout">Sair</button>
        </nav>
      </aside>
      <main class="main" id="conteudo" tabindex="-1">
        <div class="topbar">
          <div class="topbar-title">
            <button class="menu-toggle" id="menu-toggle" aria-label="Abrir menu">Menu</button>
            ${logoMark("sm")}
            <div>
              <div class="kicker">${isCompany ? "Área da empresa" : "Área do colaborador"}</div>
              <h2 style="margin:0">${pageTitle}</h2>
            </div>
          </div>
          <div class="userchip"><span class="avatar">${initials(user.name)}</span><div><b>${escapeHtml(user.name)}</b><div style="color:var(--muted);font-size:.8rem">${isCompany ? "Gestão" : "Colaborador"}</div></div></div>
        </div>
        <div id="view">Carregando...</div>
      </main>
    </div>
    ${a11yBar()}
  `;
  const toggle = document.getElementById("menu-toggle");
  if (toggle) {
    toggle.onclick = () => document.getElementById("sidebar").classList.toggle("open");
  }
  document.getElementById("logout").onclick = () => {
    clearSession();
    state.user = null;
    go("/");
  };

  const view = document.getElementById("view");
  try {
    if (isCompany) {
      if (page === "dashboard") await companyDashboard(view);
      else if (page === "colaboradores") await companyPeople(view);
      else if (page === "treinamentos" && sub) await companyTrainingEditor(view, sub);
      else if (page === "treinamentos") await companyTrainings(view);
      else if (page === "tarefas" && sub) await companyTaskDetail(view, sub);
      else if (page === "tarefas") await companyTasks(view);
      else if (page === "progresso") await companyProgress(view);
      else if (page === "avaliacoes") await companyAttempts(view);
      else if (page === "certificados" && sub) await certificateDetail(view, sub);
      else if (page === "certificados") await certificatesView(view, true);
      else if (page === "relatorios") await companyReports(view);
      else if (page === "sinais") await signalsView(view);
      else if (page === "acessibilidade") await accessibilityView(view);
      else if (page === "perfil") await profileView(view);
      else await companyDashboard(view);
    } else {
      if (page === "dashboard") await collabDashboard(view);
      else if (page === "catalogo") await catalogView(view);
      else if (page === "meus") await myTrainingsView(view);
      else if (page === "curso" && sub) await courseView(view, sub);
      else if (page === "tarefas") await collabTasks(view);
      else if (page === "avaliacoes") await collabAssessments(view);
      else if (page === "certificados" && sub) await certificateDetail(view, sub);
      else if (page === "certificados") await certificatesView(view, false);
      else if (page === "sinais") await signalsView(view);
      else if (page === "acessibilidade") await accessibilityView(view);
      else if (page === "perfil") await profileView(view);
      else await collabDashboard(view);
    }
  } catch (err) {
    view.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
}

function statusLabel(e) {
  if (e.status === "completed") return "Concluido";
  if (e.stage === "exam") return "Avaliacao pendente";
  if (e.stage === "tasks") return "Tarefas pendentes";
  if (e.stage === "quizzes") return "Atividades pendentes";
  return "Em andamento";
}

function taskStatusLabel(status) {
  if (status === "approved") return "Aprovada";
  if (status === "rejected") return "Devolver";
  if (status === "submitted") return "Enviada";
  return "Pendente";
}

function taskBadge(status) {
  const cls = status === "approved" ? "badge-ok" : status === "submitted" ? "badge-info" : "badge-warn";
  return `<span class="badge ${cls}">${taskStatusLabel(status)}</span>`;
}

async function collabDashboard(view) {
  const d = await api("/api/collaborator/dashboard");
  view.innerHTML = `
    <div class="kpis">
      <div class="card kpi"><span>Treinamentos concluidos</span><b>${d.stats.completed}</b></div>
      <div class="card kpi"><span>Em andamento</span><b>${d.stats.in_progress}</b></div>
      <div class="card kpi"><span>Obrigatorios</span><b>${d.stats.required || 0}</b></div>
      <div class="card kpi"><span>Certificados conquistados</span><b>${d.stats.certificates}</b></div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <h3>Progresso geral</h3>
      <div class="progress" style="height:14px"><span style="width:${d.stats.avg_progress}%"></span></div>
      <p style="margin:10px 0 0">Media de ${d.stats.avg_progress}% nas trilhas inscritas. O 100% so e liberado apos modulos, tarefas e avaliacao.</p>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>Meus treinamentos</h3>
        ${d.enrollments.map((e) => `
          <div style="margin:12px 0">
            <div style="display:flex;justify-content:space-between;gap:8px"><b>${escapeHtml(e.title)}</b><span>${e.progress}%</span></div>
            <div class="progress"><span style="width:${e.progress}%"></span></div>
            <small style="color:var(--muted)">${statusLabel(e)}</small>
          </div>`).join("") || "<p>Nenhuma inscricao ainda.</p>"}
        <a class="btn btn-primary btn-sm" href="#/app/meus">Continuar</a>
      </div>
      <div class="card">
        <h3>Treinamentos obrigatorios</h3>
        ${(d.required || []).map((t) => `<p><b>${escapeHtml(t.title)}</b><br><span style="color:var(--muted)">${t.status === "completed" ? "Concluido" : "Pendente"} · ${escapeHtml(t.category || "")}</span></p>`).join("") || "<p>Nenhum treinamento obrigatorio.</p>"}
        <a class="btn btn-ghost btn-sm" href="#/app/meus">Ver trilhas</a>
      </div>
    </div>
    ${(d.tasks || []).length ? `<div class="card" style="margin-top:18px">
      <h3>Tarefas do treinamento</h3>
      ${(d.tasks || []).map((tk) => `<p><b>${escapeHtml(tk.title)}</b> ${taskBadge(tk.status)}<br><span style="color:var(--muted)">${escapeHtml(tk.training_title)}${tk.due_at ? " · prazo " + fmtDate(tk.due_at) : ""}</span></p>`).join("")}
      <a class="btn btn-primary btn-sm" href="#/app/tarefas">Abrir tarefas</a>
    </div>` : ""}
  `;
}

async function catalogView(view) {
  const rows = await api("/api/trainings");
  view.innerHTML = `<div class="course-grid">${rows
    .map(
      (t) => `<article class="card">
        <img class="thumb" alt="" src="${t.thumbnail || ""}" />
        <span class="badge badge-info">${escapeHtml(t.category || "")}</span>
        <h3>${escapeHtml(t.title)}</h3>
        <p>${escapeHtml(t.description || "").slice(0, 110)}...</p>
        <p>${t.duration_minutes} min · ${escapeHtml(t.level)} · Conteudo visual com Libras e legendas</p>
        ${t.enrollment ? `<a class="btn btn-primary btn-sm" href="#/app/curso/${t.id}">Continuar</a>` : `<button class="btn btn-dark btn-sm" data-enroll="${t.id}">Inscrever-se</button>`}
      </article>`
    )
    .join("")}</div>`;
  view.querySelectorAll("[data-enroll]").forEach((btn) => {
    btn.onclick = async () => {
      await api(`/api/trainings/${btn.dataset.enroll}/enroll`, { method: "POST" });
      go(`/app/curso/${btn.dataset.enroll}`);
    };
  });
}

async function myTrainingsView(view) {
  const d = await api("/api/collaborator/dashboard");
  view.innerHTML = `<div class="course-grid">${d.enrollments
    .map(
      (e) => `<article class="card">
        <img class="thumb" alt="" src="${e.thumbnail || ""}" />
        <h3>${escapeHtml(e.title)}</h3>
        <div class="progress"><span style="width:${e.progress}%"></span></div>
        <p>${e.progress}% · ${statusLabel(e)}</p>
        <a class="btn btn-primary btn-sm" href="#/app/curso/${e.training_id}">${e.status === "completed" ? "Revisar" : "Abrir"}</a>
      </article>`
    )
    .join("") || "<div class='card'>Nenhum treinamento inscrito.</div>"}</div>`;
}

function progressCaption(info) {
  if (!info) return "0%";
  if (info.completed) return "100% concluido";
  if (info.stage === "exam") return `${info.display}% · avaliacao final pendente`;
  if (info.stage === "tasks") return `${info.display}% · tarefas do treinamento pendentes`;
  if (info.stage === "quizzes") return `${info.display}% · atividades do modulo pendentes`;
  return `${info.display}% · modulos em andamento`;
}

function quizPassed(module, info) {
  const state = info?.quizzes?.byModule?.[module.id];
  if (state) return !!state.passed;
  return (module.quizBest || 0) >= (module.quiz?.passing_score || 70);
}

async function courseView(view, id) {
  const t = await api(`/api/trainings/${id}`);
  if (!t.enrollment) {
    await api(`/api/trainings/${id}/enroll`, { method: "POST" });
  }
  const completed = new Set(t.completed_contents || []);
  const contents = t.modules.flatMap((m) => m.contents.map((c) => ({ ...c, module: m.title })));
  let info = t.progressInfo || { display: t.enrollment?.progress || 0, content: 0, stage: "modules", completed: false, exam: { passed: false } };
  let currentId = contents.find((c) => !completed.has(c.id))?.id || contents[0]?.id;

  const renderShell = () => {
    view.innerHTML = `
      <div class="course-layout">
        <div>
          <div class="card">
            <span class="badge badge-info">${escapeHtml(t.category || "")}</span>
            <h3>${escapeHtml(t.title)}</h3>
            <p>${escapeHtml(t.description || "")}</p>
            <div class="progress"><span id="bar" style="width:${info.display}%"></span></div>
            <p id="prog-label">${progressCaption(info)}</p>
          </div>
          <ol class="flow-steps">
            <li class="${info.content > 0 || info.completed ? "done" : "current"}">Conteudos</li>
            <li class="${info.stage === "quizzes" ? "current" : info.quizzes?.allPassed || info.completed ? "done" : ""}">Atividades</li>
            <li class="${info.stage === "tasks" ? "current" : info.tasks?.allSubmitted || info.completed ? "done" : ""}">Tarefas</li>
            <li class="${info.stage === "exam" ? "current" : info.completed || info.exam?.passed ? "done" : ""}">Avaliacao</li>
            <li class="${info.completed ? "done" : ""}">Certificado</li>
          </ol>
          <div class="module-list" id="mods" style="margin-top:12px">
            ${t.modules
              .map(
                (m) => `<div class="card" style="padding:12px"><b>${escapeHtml(m.title)}</b>
                ${m.contents
                  .map(
                    (c) => `<div class="module-item" data-cid="${c.id}">${completed.has(c.id) ? "●" : "○"} ${escapeHtml(c.title)}</div>`
                  )
                  .join("")}
                ${m.quiz ? `<div class="module-item" data-qid="${m.quiz.id}">${quizPassed(m, info) ? "●" : "○"} Atividade do modulo</div>` : ""}
                ${(t.tasks || []).filter((tk) => tk.module_id === m.id).map((tk) => `<div class="module-item" data-tid="${tk.id}">${tk.submission && (tk.submission.status === "submitted" || tk.submission.status === "approved") ? "●" : "○"} Tarefa: ${escapeHtml(tk.title)}</div>`).join("")}
                </div>`
              )
               .join("")}
            ${(t.tasks || []).filter((tk) => !tk.module_id).map((tk) => `<div class="card" style="padding:12px"><div class="module-item" data-tid="${tk.id}">${tk.submission && (tk.submission.status === "submitted" || tk.submission.status === "approved") ? "●" : "○"} Tarefa: ${escapeHtml(tk.title)}</div></div>`).join("")}
          </div>
        </div>
        <div>
          <div id="lesson" class="card"></div>
          <div id="exam" class="card" style="margin-top:12px"></div>
          <div id="certbox"></div>
        </div>
      </div>
    `;
    view.querySelectorAll("[data-cid]").forEach((el) => (el.onclick = () => show(Number(el.dataset.cid))));
    view.querySelectorAll("[data-qid]").forEach((el) => (el.onclick = () => showQuiz(Number(el.dataset.qid))));
    view.querySelectorAll("[data-tid]").forEach((el) => (el.onclick = () => showTask(Number(el.dataset.tid))));
  };

  const syncProgress = (next) => {
    info = {
      display: next.display ?? next.progress ?? info.display,
      content: next.content ?? info.content,
      stage: next.stage ?? info.stage,
      completed: !!next.completed,
      exam: next.exam || info.exam,
      quizzes: next.quizzes || info.quizzes,
      tasks: next.tasks || info.tasks
    };
    const bar = document.getElementById("bar");
    const label = document.getElementById("prog-label");
    if (bar) bar.style.width = info.display + "%";
    if (label) label.textContent = progressCaption(info);
  };

  const renderExam = () => {
    const exam = document.getElementById("exam");
    if (!exam || !t.activity) {
      if (exam) exam.innerHTML = "";
      return;
    }
    if (info.content < 100 || (info.quizzes && !info.quizzes.allPassed) || (info.tasks && !info.tasks.allSubmitted)) {
      exam.innerHTML = `<h3>Avaliacao final</h3><p>Conclua conteudos, atividades de cada modulo e as tarefas obrigatorias para liberar a avaliacao final. Nota minima ${t.activity.passing_score}%.</p>`;
      return;
    }
    if (info.completed) {
      exam.innerHTML = `<h3>Avaliacao concluida</h3><p>Voce foi aprovado. Nota minima ${t.activity.passing_score}%.</p>
        <a class="btn btn-primary btn-sm" href="#/app/certificados">Ver certificado</a>`;
      return;
    }
    startQuiz(exam, t.activity, { kind: "final" }, (result) => {
      syncProgress(result);
      if (result.certificate) t.certificate = result.certificate;
      if (result.quizzes) info.quizzes = result.quizzes;
      renderExam();
      renderCert();
    });
  };

  const renderCert = () => {
    const box = document.getElementById("certbox");
    if (!box) return;
    if (info.completed && t.certificate) {
      box.innerHTML = `<div class="card cert" style="margin-top:12px">
        <h3>Treinamento concluido</h3>
        <p>Avaliacao aprovada. Certificado ${escapeHtml(t.certificate.code)} liberado.</p>
        <a class="btn btn-primary" href="#/app/certificados/${t.certificate.id}">Visualizar certificado</a>
      </div>`;
    } else {
      box.innerHTML = "";
    }
  };

  const show = (cid) => {
    currentId = cid;
    const c = contents.find((x) => x.id === cid);
    const lesson = document.getElementById("lesson");
    if (!c || !lesson) return;
    view.querySelectorAll(".module-item").forEach((el) => el.classList.toggle("active", Number(el.dataset.cid) === cid));
    const typeLabel = { text: "TEXTO", image: "INFOGRAFICO", libras: "LIBRAS" }[c.type] || "CONTEUDO";
    let media = "";
    const fig = figureFor(c.title);
    if (fig) {
      media = `<div class="visual-block">${fig}</div>`;
    } else if (c.media_url) {
      media = `<div class="visual-block"><img alt="${escapeHtml(c.title)}" src="${escapeHtml(c.media_url)}" /></div>`;
    }
    const already = completed.has(c.id);
    lesson.innerHTML = `
      <div class="kicker">${escapeHtml(c.module)} · ${typeLabel}</div>
      <h3>${escapeHtml(c.title)}</h3>
      ${media}
      <p style="white-space:pre-wrap">${escapeHtml(c.body || "")}</p>
      ${state.a11y.captions && c.captions ? `<div class="captions">${escapeHtml(c.captions)}</div>` : ""}
      ${state.a11y.libras && c.libras_notes ? `<div class="libras-box"><b>Recurso de Libras</b><p>${escapeHtml(c.libras_notes)}</p></div>` : ""}
      ${already
        ? `<div class="okmsg">Modulo de conteudo ja registrado.</div>`
        : `<button class="btn btn-primary" id="done">Marcar conteudo como lido</button>`}
    `;
    const doneBtn = document.getElementById("done");
    if (doneBtn) {
      doneBtn.onclick = async () => {
        const r = await api(`/api/contents/${c.id}/complete`, { method: "POST" });
        completed.add(c.id);
        const item = view.querySelector(`.module-item[data-cid="${c.id}"]`);
        if (item) item.innerHTML = `● ${escapeHtml(c.title)}`;
        syncProgress(r);
        renderExam();
        renderCert();
        show(c.id);
      };
    }
  };

  const showQuiz = (quizId) => {
    const lesson = document.getElementById("lesson");
    const examBox = document.getElementById("exam");
    if (examBox) examBox.innerHTML = "";
    const mod = t.modules.find((m) => m.quiz?.id === quizId);
    if (!mod || !lesson) return;
    view.querySelectorAll(".module-item").forEach((el) => el.classList.toggle("active", Number(el.dataset.qid) === quizId));
    const moduleContents = mod.contents || [];
    const moduleDone = moduleContents.every((c) => completed.has(c.id));
    const runModuleQuiz = () => {
      startQuiz(lesson, mod.quiz, { kind: "module", moduleTitle: mod.title }, (result) => {
        syncProgress(result);
        if (result.quizzes) info.quizzes = result.quizzes;
        mod.quizBest = result.score;
        const item = view.querySelector(`.module-item[data-qid="${mod.quiz.id}"]`);
        if (item && result.passed) item.innerHTML = `● Atividade do modulo`;
        renderExam();
        renderCert();
      });
    };
    if (!moduleDone) {
      lesson.innerHTML = `<div class="kicker">${escapeHtml(mod.title)}</div><h3>Atividade do modulo</h3><p>Conclua os conteudos desta etapa para liberar as perguntas.</p>`;
      return;
    }
    if (quizPassed(mod, info)) {
      lesson.innerHTML = `<div class="kicker">${escapeHtml(mod.title)}</div><h3>${escapeHtml(mod.quiz.title)}</h3>
        <div class="okmsg">Atividade concluida. Melhor nota ${mod.quizBest || info.quizzes?.byModule?.[mod.id]?.bestScore || 0}%.</div>
        <button class="btn btn-ghost" id="retry-mod">Refazer atividade</button>`;
      const retry = document.getElementById("retry-mod");
      if (retry) retry.onclick = () => runModuleQuiz();
      return;
    }
    runModuleQuiz();
  };

  const showTask = (taskId) => {
    const lesson = document.getElementById("lesson");
    const examBox = document.getElementById("exam");
    if (examBox) examBox.innerHTML = "";
    const tk = (t.tasks || []).find((x) => x.id === taskId);
    if (!tk || !lesson) return;
    view.querySelectorAll(".module-item").forEach((el) => el.classList.toggle("active", Number(el.dataset.tid) === taskId));
    const sub = tk.submission;
    const status = sub?.status || "pending";
    const canSend = status === "pending" || status === "rejected";
    lesson.innerHTML = `
      <div class="kicker">Tarefa do treinamento${tk.module_title ? " · " + escapeHtml(tk.module_title) : ""}</div>
      <h3>${escapeHtml(tk.title)}</h3>
      <p>${escapeHtml(tk.instructions || "")}</p>
      ${tk.due_at ? `<p style="color:var(--muted)">Prazo ${fmtDate(tk.due_at)}</p>` : ""}
      ${taskBadge(status)}
      ${status === "rejected" && sub?.result_note ? `<div class="error">${escapeHtml(sub.result_note)}</div>` : ""}
      ${status === "approved" && sub?.result_note ? `<div class="okmsg">${escapeHtml(sub.result_note)}</div>` : ""}
      ${status === "submitted" ? `<div class="okmsg">Resposta enviada. Aguarde a avaliacao da empresa.</div><p style="white-space:pre-wrap">${escapeHtml(sub.answer || "")}</p>` : ""}
      ${status === "approved" ? `<p style="white-space:pre-wrap">${escapeHtml(sub.answer || "")}</p>` : ""}
      ${canSend ? `<form id="task-send">
        <label>Sua resposta</label>
        <textarea name="answer" required placeholder="Descreva a evidencia visual do posto">${escapeHtml(sub?.answer || "")}</textarea>
        <div id="task-msg"></div>
        <button class="btn btn-primary" type="submit">Enviar tarefa</button>
      </form>` : ""}
    `;
    const form = document.getElementById("task-send");
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const answer = new FormData(form).get("answer");
        try {
          const r = await api(`/api/tasks/${tk.id}/submit`, { method: "POST", body: JSON.stringify({ answer }) });
          tk.submission = r.submission;
          syncProgress(r);
          const item = view.querySelector(`.module-item[data-tid="${tk.id}"]`);
          if (item) item.innerHTML = `● Tarefa: ${escapeHtml(tk.title)}`;
          renderExam();
          renderCert();
          showTask(tk.id);
        } catch (err) {
          document.getElementById("task-msg").innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
        }
      };
    }
  };

  renderShell();
  if (currentId) show(currentId);
  renderExam();
  renderCert();
}

function startQuiz(box, activity, meta, onDone) {
  const questions = activity.questions || [];
  if (!questions.length) {
    box.innerHTML = `<div class="error">Esta atividade ainda nao possui perguntas.</div>`;
    return;
  }
  let idx = 0;
  const answers = {};
  const results = {};
  const isFinal = meta.kind === "final";
  const draw = () => {
    const q = questions[idx];
    const answered = results[q.id];
    const pct = Math.round((idx / questions.length) * 100);
    box.innerHTML = `
      <div class="kicker">${isFinal ? "Avaliacao final" : "Atividade do modulo"}</div>
      <h3>${escapeHtml(activity.title)}</h3>
      ${meta.moduleTitle ? `<p>${escapeHtml(meta.moduleTitle)}</p>` : ""}
      <p>Questao ${idx + 1} de ${questions.length}</p>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <fieldset class="quiz-q">
        <legend><b>${escapeHtml(q.prompt)}</b></legend>
        ${q.options
          .map(
            (o) => `<label class="quiz-opt"><input type="radio" name="opt" value="${o.id}" ${answers[q.id] === o.id ? "checked" : ""} ${answered ? "disabled" : ""} /> ${escapeHtml(o.label)}</label>`
          )
          .join("")}
      </fieldset>
      <div id="quiz-msg">${answered ? `<div class="${answered.correct ? "okmsg" : "error"}">${answered.correct ? "Resposta correta." : "Resposta incorreta."}</div>` : ""}</div>
      <div class="row-actions">
        ${idx > 0 ? `<button class="btn btn-ghost" id="qprev" type="button">Voltar</button>` : ""}
        <button class="btn btn-primary" id="qnext" type="button">${answered ? (idx === questions.length - 1 ? "Ver pontuacao" : "Proxima") : "Responder"}</button>
      </div>
    `;
    document.getElementById("qnext").onclick = async () => {
      if (!results[q.id]) {
        const sel = box.querySelector("input[name=opt]:checked");
        if (!sel) {
          document.getElementById("quiz-msg").innerHTML = `<div class="error">Selecione uma alternativa.</div>`;
          return;
        }
        answers[q.id] = Number(sel.value);
        try {
          const check = await api(`/api/activities/${activity.id}/check`, {
            method: "POST",
            body: JSON.stringify({ question_id: q.id, option_id: Number(sel.value) })
          });
          results[q.id] = check;
          draw();
        } catch (err) {
          document.getElementById("quiz-msg").innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
        }
        return;
      }
      if (idx < questions.length - 1) {
        idx += 1;
        draw();
        return;
      }
      try {
        const r = await api(`/api/activities/${activity.id}/submit`, { method: "POST", body: JSON.stringify({ answers }) });
        box.innerHTML = `<div role="status" class="${r.passed ? "okmsg" : "error"}">
            <h3>${r.passed ? "Aprovado" : "Reprovado"}</h3>
            <p>Pontuacao ${r.score}% · ${r.correct} de ${r.total} acertos · minimo ${r.passing_score}%</p>
          </div>
          ${r.passed
            ? (isFinal
              ? `<p>Treinamento 100% concluido. Certificado liberado.</p><a class="btn btn-primary" href="#/app/certificados">Ver certificado</a>`
              : `<p>Atividade desta etapa concluida. Avance para o proximo modulo ou para a avaliacao final.</p>`)
            : `<p>Revise o conteudo e tente novamente. Nota minima 70%.</p><button class="btn btn-dark" id="retry">Refazer</button>`}`;
        const retry = document.getElementById("retry");
        if (retry) retry.onclick = () => startQuiz(box, activity, meta, onDone);
        onDone(r);
      } catch (err) {
        document.getElementById("quiz-msg").innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
      }
    };
    const prev = document.getElementById("qprev");
    if (prev) prev.onclick = () => {
      idx -= 1;
      draw();
    };
  };
  draw();
}

function certCard(c, actions = true) {
  const hours = Math.max(1, Math.round((c.duration_minutes || 60) / 60));
  return `<div class="card cert" style="margin-bottom:14px">
        <div class="cert-brand">${logo("dark")}</div>
        <div class="kicker">SOUND QUEST · Certificado corporativo</div>
        <h2>Capacitacao concluida</h2>
        <p>Certificamos que</p>
        <h3>${escapeHtml(c.user_name || state.user.name)}</h3>
        <p>concluiu o treinamento</p>
        <h3>${escapeHtml(c.title)}</h3>
        <p>Carga horaria: ${hours}h · ${c.duration_minutes || 60} minutos</p>
        <p>Conclusao em ${fmtDate(c.issued_at)}</p>
        <p>Codigo ${escapeHtml(c.code)}</p>
        ${c.company_name ? `<p>${escapeHtml(c.company_name)}</p>` : ""}
        ${actions ? `<div class="row-actions" style="justify-content:center;margin-top:12px">
          <a class="btn btn-primary btn-sm" href="#/app/certificados/${c.id}">Visualizar</a>
          <button class="btn btn-ghost btn-sm" data-print="${c.id}">Baixar / imprimir</button>
        </div>` : ""}
      </div>`;
}

async function certificatesView(view) {
  const rows = await api("/api/certificates");
  view.innerHTML = rows.map((c) => certCard(c)).join("") || "<div class='card'>Nenhum certificado emitido.</div>";
  view.querySelectorAll("[data-print]").forEach((b) => {
    b.onclick = () => go(`/app/certificados/${b.dataset.print}`);
  });
}

async function certificateDetail(view, id) {
  const c = await api(`/api/certificates/${id}`);
  view.innerHTML = `${certCard(c, false)}
    <div class="row-actions">
      <button class="btn btn-primary" id="print-cert">Baixar / imprimir</button>
      <a class="btn btn-ghost" href="#/app/certificados">Voltar</a>
    </div>`;
  document.getElementById("print-cert").onclick = () => window.print();
}

async function collabAssessments(view) {
  const d = await api("/api/collaborator/attempts");
  view.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <h3>Avaliacoes das trilhas</h3>
      ${(d.trainings || []).map((t) => {
        const modulesDone = t.total_contents && t.done_contents >= t.total_contents;
        const passed = t.best_score != null && t.best_score >= (t.passing_score || 70);
        let stateTxt = "Conteudos e atividades pendentes";
        if (!t.activity_id) stateTxt = "Sem avaliacao final";
        else if (!modulesDone) stateTxt = "Conclua os conteudos e as atividades de cada modulo";
        else if (passed) stateTxt = `Aprovado · melhor nota ${t.best_score}%`;
        else if (t.best_score != null) stateTxt = `Reprovado · ${t.best_score}% · refazer`;
        else stateTxt = "Avaliacao final liberada";
        return `<div style="margin:12px 0;padding-bottom:12px;border-bottom:1px solid var(--line)">
          <b>${escapeHtml(t.title)}</b>
          <p style="margin:4px 0;color:var(--muted)">${stateTxt}</p>
          <a class="btn btn-primary btn-sm" href="#/app/curso/${t.id}">${passed ? "Revisar" : "Abrir avaliacao"}</a>
        </div>`;
      }).join("") || "<p>Nenhuma trilha inscrita.</p>"}
    </div>
    <div class="card">
      <h3>Historico de tentativas</h3>
      <table class="table">
        <tr><th>Treinamento</th><th>Nota</th><th>Resultado</th><th>Data</th></tr>
         ${(d.attempts || []).map((a) => `<tr><td>${escapeHtml(a.training_title)} · ${escapeHtml(a.activity_title || "")}</td><td>${a.score}%</td><td><span class="badge ${a.passed ? "badge-ok" : "badge-warn"}">${a.passed ? "Aprovado" : "Reprovado"}</span></td><td>${fmtDate(a.created_at)}</td></tr>`).join("") || "<tr><td colspan='4'>Nenhuma tentativa ainda.</td></tr>"}
      </table>
    </div>
  `;
}

async function accessibilityView(view) {
  view.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <div class="kicker">Acessibilidade</div>
      <h3>Recursos visuais da plataforma</h3>
      <p>As informacoes importantes nao dependem de audio. Use os controles abaixo ou a barra flutuante HC / A+ / A-.</p>
      <div class="row-actions" style="margin:16px 0">
        <button class="btn ${state.a11y.contrast ? "btn-dark" : "btn-ghost"}" id="hc">Alto contraste ${state.a11y.contrast ? "ligado" : "desligado"}</button>
        <button class="btn btn-ghost" id="aplus">Aumentar texto (A+)</button>
        <button class="btn btn-ghost" id="aminus">Diminuir texto (A-)</button>
      </div>
      <p>Tamanho atual do texto: ${state.a11y.font}px</p>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>Conteudos visuais</h3>
        <ul>
          <li>Textos estruturados em cada modulo</li>
          <li>Imagens e infograficos alinhados ao tema da aula</li>
          <li>Legendas descritivas nos materiais visuais</li>
          <li>Janela de apoio em Libras quando disponivel</li>
        </ul>
        <label><input type="checkbox" id="libras" ${state.a11y.libras ? "checked" : ""} /> Exibir recursos de Libras</label>
        <label><input type="checkbox" id="caps" ${state.a11y.captions ? "checked" : ""} /> Exibir legendas e textos de apoio</label>
      </div>
      <div class="card">
        <h3>Como usar no chao de fabrica</h3>
        <p>Ative o alto contraste em ambientes com pouca iluminacao. Amplie o texto em tablets. Confirme o entendimento pelos infograficos, nao por audio.</p>
      </div>
    </div>
  `;
  document.getElementById("hc").onclick = () => {
    window.sqA11y("contrast");
    accessibilityView(view);
  };
  document.getElementById("aplus").onclick = () => {
    window.sqA11y("plus");
    accessibilityView(view);
  };
  document.getElementById("aminus").onclick = () => {
    window.sqA11y("minus");
    accessibilityView(view);
  };
  document.getElementById("libras").onchange = (e) => {
    state.a11y.libras = e.target.checked;
    applyA11y();
  };
  document.getElementById("caps").onchange = (e) => {
    state.a11y.captions = e.target.checked;
    applyA11y();
  };
}

async function profileView(view) {
  const me = await api("/api/me");
  const u = me.user;
  view.innerHTML = `<form class="card form" id="pf" style="max-width:560px">
    <label>Nome</label><input name="name" value="${escapeHtml(u.name)}" />
    <label>Telefone</label><input name="phone" value="${escapeHtml(u.phone || "")}" />
    <label>Departamento</label><input name="department" value="${escapeHtml(u.department || "")}" />
    <label>Cargo</label><input name="position" value="${escapeHtml(u.position || "")}" />
    <label><input type="checkbox" name="libras" ${state.a11y.libras ? "checked" : ""} /> Exibir janela de Libras</label>
    <label><input type="checkbox" name="captions" ${state.a11y.captions ? "checked" : ""} /> Exibir legendas</label>
    <div id="pfmsg"></div>
    <button class="btn btn-primary" type="submit">Salvar perfil</button>
  </form>`;
  document.getElementById("pf").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.a11y.libras = fd.get("libras") === "on";
    state.a11y.captions = fd.get("captions") === "on";
    applyA11y();
    const user = await api("/api/me", {
      method: "PUT",
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        department: fd.get("department"),
        position: fd.get("position"),
        accessibility_prefs: state.a11y
      })
    });
    state.user = user.user;
    localStorage.setItem("sq_user", JSON.stringify(user.user));
    document.getElementById("pfmsg").innerHTML = `<div class="okmsg">Perfil atualizado.</div>`;
  };
}

async function companyDashboard(view) {
  const d = await api("/api/company/dashboard");
  view.innerHTML = `
    <div class="kpis">
      <div class="card kpi"><span>Colaboradores</span><b>${d.stats.collaborators}</b></div>
      <div class="card kpi"><span>Treinamentos</span><b>${d.stats.trainings}</b></div>
      <div class="card kpi"><span>Conclusoes</span><b>${d.stats.completed}</b></div>
      <div class="card kpi"><span>Certificados</span><b>${d.stats.certificates}</b></div>
    </div>
    ${d.stats.tasks ? `<div class="kpis">
      <div class="card kpi"><span>Tarefas pendentes</span><b>${d.stats.tasks.pending || 0}</b></div>
      <div class="card kpi"><span>Tarefas enviadas</span><b>${d.stats.tasks.submitted || 0}</b></div>
      <div class="card kpi"><span>Tarefas aprovadas</span><b>${d.stats.tasks.approved || 0}</b></div>
      <div class="card kpi"><span>Total de tarefas</span><b>${d.stats.tasks.total || 0}</b></div>
    </div>` : ""}
    <div class="grid-2">
      <div class="card">
        <h3>Progresso por treinamento</h3>
        <div class="chart">
          ${d.byTraining.map((t) => `<div class="bar" style="height:${Math.max(8, t.avg_progress || 0)}%"><span>${t.avg_progress || 0}%</span></div>`).join("")}
        </div>
        <p>${d.byTraining.map((t) => escapeHtml(t.title.split(":")[0] || t.title)).join(" · ")}</p>
      </div>
      <div class="card">
        <h3>Avaliacoes recentes</h3>
        <table class="table">${d.recentAttempts.map((a) => `<tr><td>${escapeHtml(a.user_name)}</td><td>${escapeHtml(a.training_title)}</td><td><span class="badge ${a.passed ? "badge-ok" : "badge-warn"}">${a.score}%</span></td></tr>`).join("")}</table>
      </div>
    </div>
  `;
}

async function companyPeople(view) {
  const rows = await api("/api/company/collaborators");
  view.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <h3>Novo colaborador</h3>
      <form id="np" class="grid-2">
        <input name="name" placeholder="Nome" required />
        <input name="email" type="email" placeholder="E-mail" required />
        <input name="password" placeholder="Senha inicial" required />
        <input name="department" placeholder="Departamento" />
        <input name="position" placeholder="Cargo" />
        <button class="btn btn-primary" type="submit">Cadastrar</button>
      </form>
      <div id="npmsg"></div>
    </div>
    <div class="card"><table class="table">
      <tr><th>Nome</th><th>E-mail</th><th>Area</th><th>Progresso</th><th></th></tr>
      ${rows
        .map(
          (u) => `<tr>
            <td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.department || "-")}</td>
            <td>${u.avg_progress || 0}%</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm" data-edit="${u.id}">Editar</button>
              <button class="btn btn-danger btn-sm" data-del="${u.id}">Excluir</button>
            </td>
          </tr>`
        )
        .join("")}
    </table></div>
    <div id="modal"></div>
  `;
  document.getElementById("np").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api("/api/company/collaborators", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
      companyPeople(view);
    } catch (err) {
      document.getElementById("npmsg").innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  };
  view.querySelectorAll("[data-del]").forEach((b) => {
    b.onclick = async () => {
      if (confirm("Excluir colaborador?")) {
        await api(`/api/company/collaborators/${b.dataset.del}`, { method: "DELETE" });
        companyPeople(view);
      }
    };
  });
  view.querySelectorAll("[data-edit]").forEach((b) => {
    b.onclick = () => {
      const u = rows.find((r) => String(r.id) === b.dataset.edit);
      if (!u) return;
      document.getElementById("modal").innerHTML = `<div class="modal-bg"><form class="modal card" id="ed">
        <h3>Editar colaborador</h3>
        <label>Nome</label><input name="name" value="${escapeHtml(u.name)}" />
        <label>E-mail</label><input name="email" value="${escapeHtml(u.email)}" />
        <label>Departamento</label><input name="department" value="${escapeHtml(u.department || "")}" />
        <label>Cargo</label><input name="position" value="${escapeHtml(u.position || "")}" />
        <label>Status</label><select name="status"><option ${u.status === "active" ? "selected" : ""}>active</option><option ${u.status === "inactive" ? "selected" : ""}>inactive</option></select>
        <div class="row-actions" style="margin-top:12px"><button class="btn btn-primary" type="submit">Salvar</button><button type="button" class="btn btn-ghost" id="cc">Cancelar</button></div>
      </form></div>`;
      document.getElementById("cc").onclick = () => (document.getElementById("modal").innerHTML = "");
      document.getElementById("ed").onsubmit = async (ev) => {
        ev.preventDefault();
        await api(`/api/company/collaborators/${u.id}`, { method: "PUT", body: JSON.stringify(Object.fromEntries(new FormData(ev.target))) });
        companyPeople(view);
      };
    };
  });
}

async function companyTrainings(view) {
  const rows = await api("/api/company/trainings");
  view.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <h3>Novo treinamento</h3>
      <form id="nt" class="grid-2">
        <input name="title" placeholder="Titulo" required />
        <input name="category" placeholder="Categoria" />
        <input name="duration_minutes" type="number" placeholder="Duracao (min)" />
        <select name="level"><option>Basico</option><option>Intermediario</option><option>Avancado</option></select>
        <textarea name="description" placeholder="Descricao"></textarea>
        <button class="btn btn-primary" type="submit">Criar</button>
      </form>
    </div>
    <div class="course-grid">${rows
      .map(
        (t) => `<article class="card">
          <h3>${escapeHtml(t.title)}</h3>
          <p>${escapeHtml(t.category || "")} · ${t.modules_count} modulos · ${t.enrolled || 0} inscritos</p>
          <div class="progress"><span style="width:${t.avg_progress || 0}%"></span></div>
          <div class="row-actions" style="margin-top:10px">
            <a class="btn btn-primary btn-sm" href="#/app/treinamentos/${t.id}">Gerenciar</a>
            <button class="btn btn-danger btn-sm" data-del="${t.id}">Excluir</button>
          </div>
        </article>`
      )
      .join("")}</div>`;
  document.getElementById("nt").onsubmit = async (e) => {
    e.preventDefault();
    await api("/api/company/trainings", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    companyTrainings(view);
  };
  view.querySelectorAll("[data-del]").forEach((b) => {
    b.onclick = async () => {
      if (confirm("Excluir treinamento e seus conteudos?")) {
        await api(`/api/company/trainings/${b.dataset.del}`, { method: "DELETE" });
        companyTrainings(view);
      }
    };
  });
}

async function companyTrainingEditor(view, id) {
  const t = await api(`/api/trainings/${id}`);
  view.innerHTML = `
    <div class="card">
      <form id="et" class="grid-2">
        <input name="title" value="${escapeHtml(t.title)}" />
        <input name="category" value="${escapeHtml(t.category || "")}" />
        <input name="duration_minutes" type="number" value="${t.duration_minutes}" />
        <select name="level"><option ${t.level === "Basico" ? "selected" : ""}>Basico</option><option ${t.level === "Intermediario" ? "selected" : ""}>Intermediario</option><option ${t.level === "Avancado" ? "selected" : ""}>Avancado</option></select>
        <textarea name="description">${escapeHtml(t.description || "")}</textarea>
        <button class="btn btn-primary" type="submit">Salvar dados</button>
      </form>
    </div>
    <div class="card" style="margin-top:12px">
      <h3>Modulos e conteudos</h3>
      <form id="nm" class="row-actions"><input name="title" placeholder="Novo modulo" required /><button class="btn btn-dark btn-sm">Adicionar modulo</button></form>
      <div id="mods">${t.modules
        .map(
          (m) => `<div class="card" style="margin-top:10px">
            <b>${escapeHtml(m.title)}</b>
            <button class="btn btn-danger btn-sm" data-dmod="${m.id}">Excluir modulo</button>
            ${m.contents.map((c) => `<p>${escapeHtml(c.title)} · ${c.type} <button class="btn btn-danger btn-sm" data-dcon="${c.id}">x</button></p>`).join("")}
            <p>${m.quiz ? `Atividade do modulo: ${m.quiz.questions?.length || 0} perguntas` : "Atividade do modulo sera gerada automaticamente"}</p>
            <form data-addc="${m.id}" class="grid-2" style="margin-top:8px">
              <input name="title" placeholder="Titulo do conteudo" required />
              <select name="type"><option value="text">Texto</option><option value="image">Imagem</option><option value="libras">Libras</option></select>
              <input name="media_url" placeholder="URL de midia (opcional)" />
              <textarea name="body" placeholder="Texto / descricao"></textarea>
              <textarea name="captions" placeholder="Legendas"></textarea>
              <textarea name="libras_notes" placeholder="Notas de Libras"></textarea>
              <button class="btn btn-primary btn-sm">Adicionar conteudo</button>
            </form>
          </div>`
        )
        .join("")}</div>
    </div>
    <div class="card" style="margin-top:12px">
      <h3>Avaliacao</h3>
      <form id="act">
        <input name="title" placeholder="Titulo da avaliacao" value="${escapeHtml(t.activity?.title || "")}" required />
        <textarea name="description" placeholder="Descricao">${escapeHtml(t.activity?.description || "")}</textarea>
        <input name="q1" placeholder="Pergunta 1" />
        <input name="q1a" placeholder="Alternativa correta" />
        <input name="q1b" placeholder="Alternativa incorreta" />
        <button class="btn btn-primary" type="submit">Salvar avaliacao</button>
      </form>
    </div>
    <div class="card" style="margin-top:12px">
      <h3>Tarefas do treinamento</h3>
      <p>Vincule tarefas ao treinamento ou a um modulo. O colaborador envia a resposta no curso.</p>
      <form id="ntask" class="grid-2">
        <input name="title" placeholder="Titulo da tarefa" required />
        <select name="module_id">
          <option value="">Treinamento inteiro</option>
          ${t.modules.map((m) => `<option value="${m.id}">${escapeHtml(m.title)}</option>`).join("")}
        </select>
        <input name="due_at" type="date" />
        <textarea name="instructions" placeholder="Instrucoes visuais para o posto"></textarea>
        <button class="btn btn-primary" type="submit">Criar tarefa</button>
        <button class="btn btn-ghost" type="button" id="gen-tasks">Gerar pelo tema</button>
      </form>
      <div id="taskmsg"></div>
      ${(t.tasks || []).map((tk) => `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
        <b>${escapeHtml(tk.title)}</b> ${taskBadge(tk.submitted || tk.approved ? "submitted" : "pending")}
        <p style="color:var(--muted);margin:4px 0">${escapeHtml(tk.module_title || "Treinamento")} · prazo ${tk.due_at ? fmtDate(tk.due_at) : "-"} · ${tk.approved || 0} aprovadas · ${tk.submitted || 0} enviadas · ${tk.pending || 0} pendentes</p>
        <p>${escapeHtml(tk.instructions || "")}</p>
        <div class="row-actions">
          <a class="btn btn-primary btn-sm" href="#/app/tarefas/${tk.id}">Ver respostas</a>
          <button class="btn btn-danger btn-sm" data-dtask="${tk.id}">Excluir</button>
        </div>
      </div>`).join("") || "<p>Nenhuma tarefa vinculada ainda.</p>"}
    </div>
  `;
  document.getElementById("et").onsubmit = async (e) => {
    e.preventDefault();
    await api(`/api/company/trainings/${id}`, { method: "PUT", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    companyTrainingEditor(view, id);
  };
  document.getElementById("nm").onsubmit = async (e) => {
    e.preventDefault();
    await api(`/api/company/trainings/${id}/modules`, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    companyTrainingEditor(view, id);
  };
  view.querySelectorAll("[data-dmod]").forEach((b) => {
    b.onclick = async () => {
      await api(`/api/company/modules/${b.dataset.dmod}`, { method: "DELETE" });
      companyTrainingEditor(view, id);
    };
  });
  view.querySelectorAll("[data-dcon]").forEach((b) => {
    b.onclick = async () => {
      await api(`/api/company/contents/${b.dataset.dcon}`, { method: "DELETE" });
      companyTrainingEditor(view, id);
    };
  });
  view.querySelectorAll("[data-addc]").forEach((f) => {
    f.onsubmit = async (e) => {
      e.preventDefault();
      await api(`/api/company/modules/${f.dataset.addc}/contents`, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(f))) });
      companyTrainingEditor(view, id);
    };
  });
  document.getElementById("act").onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    await api(`/api/company/trainings/${id}/activity`, {
      method: "POST",
      body: JSON.stringify({
        title: fd.title,
        description: fd.description,
        passing_score: 70,
        questions: fd.q1
          ? [{ prompt: fd.q1, options: [{ label: fd.q1a, is_correct: true }, { label: fd.q1b, is_correct: false }] }]
          : []
      })
    });
    companyTrainingEditor(view, id);
  };
  document.getElementById("ntask").onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      await api("/api/company/tasks", {
        method: "POST",
        body: JSON.stringify({
          training_id: Number(id),
          title: fd.title,
          instructions: fd.instructions,
          due_at: fd.due_at || null,
          module_id: fd.module_id || null,
          required: 1
        })
      });
      companyTrainingEditor(view, id);
    } catch (err) {
      document.getElementById("taskmsg").innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  };
  document.getElementById("gen-tasks").onclick = async () => {
    try {
      const r = await api(`/api/company/trainings/${id}/tasks/generate`, { method: "POST" });
      document.getElementById("taskmsg").innerHTML = `<div class="okmsg">${escapeHtml(r.message || (r.tasks?.length ? r.tasks.length + " tarefas geradas." : "Tarefas geradas."))}</div>`;
      companyTrainingEditor(view, id);
    } catch (err) {
      document.getElementById("taskmsg").innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  };
  view.querySelectorAll("[data-dtask]").forEach((b) => {
    b.onclick = async () => {
      if (confirm("Excluir esta tarefa?")) {
        await api(`/api/company/tasks/${b.dataset.dtask}`, { method: "DELETE" });
        companyTrainingEditor(view, id);
      }
    };
  });
}

async function companyTasks(view) {
  const rows = await api("/api/company/tasks");
  const trainings = await api("/api/company/trainings");
  view.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <h3>Nova tarefa</h3>
      <form id="ctask" class="grid-2">
        <select name="training_id" required>
          <option value="">Selecione o treinamento</option>
          ${trainings.map((t) => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join("")}
        </select>
        <input name="title" placeholder="Titulo" required />
        <input name="due_at" type="date" />
        <textarea name="instructions" placeholder="Instrucoes"></textarea>
        <button class="btn btn-primary" type="submit">Criar e vincular</button>
      </form>
      <div id="ctmsg"></div>
    </div>
    <div class="card"><table class="table">
      <tr><th>Tarefa</th><th>Treinamento</th><th>Prazo</th><th>Pendentes</th><th>Enviadas</th><th>Aprovadas</th><th></th></tr>
      ${rows.map((tk) => `<tr>
        <td>${escapeHtml(tk.title)}</td>
        <td>${escapeHtml(tk.training_title)}${tk.module_title ? " · " + escapeHtml(tk.module_title) : ""}</td>
        <td>${tk.due_at ? fmtDate(tk.due_at) : "-"}</td>
        <td>${tk.pending}</td>
        <td>${tk.submitted}</td>
        <td>${tk.approved}</td>
        <td><a class="btn btn-primary btn-sm" href="#/app/tarefas/${tk.id}">Respostas</a></td>
      </tr>`).join("") || "<tr><td colspan='7'>Nenhuma tarefa criada.</td></tr>"}
    </table></div>
  `;
  document.getElementById("ctask").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api("/api/company/tasks", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
      companyTasks(view);
    } catch (err) {
      document.getElementById("ctmsg").innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  };
}

async function companyTaskDetail(view, id) {
  const tk = await api(`/api/company/tasks/${id}`);
  view.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <p class="kicker">${escapeHtml(tk.training_title)}${tk.module_title ? " · " + escapeHtml(tk.module_title) : ""}</p>
      <h3>${escapeHtml(tk.title)}</h3>
      <p>${escapeHtml(tk.instructions || "")}</p>
      <p>Prazo ${tk.due_at ? fmtDate(tk.due_at) : "-"} · ${tk.pending} pendentes · ${tk.submitted} enviadas · ${tk.approved} aprovadas</p>
      <a class="btn btn-ghost btn-sm" href="#/app/tarefas">Voltar</a>
    </div>
    <div class="card"><table class="table">
      <tr><th>Colaborador</th><th>Status</th><th>Resposta</th><th>Resultado</th></tr>
      ${(tk.submissions || []).map((s) => `<tr>
        <td>${escapeHtml(s.user_name)}<br><small>${escapeHtml(s.department || "")}</small></td>
        <td>${taskBadge(s.status || "pending")}</td>
        <td>${s.answer ? escapeHtml(s.answer).slice(0, 180) : "-"}</td>
        <td>${s.status === "submitted" ? `<form data-rev="${s.user_id}" class="row-actions">
          <input name="result_note" placeholder="Comentario" />
          <button class="btn btn-primary btn-sm" data-st="approved" type="submit">Aprovar</button>
          <button class="btn btn-ghost btn-sm" data-st="rejected" type="submit">Devolver</button>
        </form>` : (s.result_note ? escapeHtml(s.result_note) : "-")}</td>
      </tr>`).join("")}
    </table></div>
  `;
  view.querySelectorAll("[data-rev]").forEach((f) => {
    f.onsubmit = async (e) => {
      e.preventDefault();
      const status = e.submitter?.dataset.st || "approved";
      await api(`/api/company/tasks/${id}/review`, {
        method: "POST",
        body: JSON.stringify({
          user_id: Number(f.dataset.rev),
          status,
          result_note: new FormData(f).get("result_note")
        })
      });
      companyTaskDetail(view, id);
    };
  });
}

async function collabTasks(view) {
  const d = await api("/api/collaborator/tasks");
  view.innerHTML = `
    <div class="kpis">
      <div class="card kpi"><span>Pendentes</span><b>${d.stats.pending}</b></div>
      <div class="card kpi"><span>Enviadas</span><b>${d.stats.submitted}</b></div>
      <div class="card kpi"><span>Aprovadas</span><b>${d.stats.approved}</b></div>
      <div class="card kpi"><span>Total</span><b>${d.stats.total}</b></div>
    </div>
    <div class="course-grid">${(d.tasks || []).map((tk) => `<article class="card">
      <span class="kicker">${escapeHtml(tk.training_title)}</span>
      <h3>${escapeHtml(tk.title)}</h3>
      ${taskBadge(tk.my_status)}
      <p>${escapeHtml(tk.instructions || "").slice(0, 140)}</p>
      <p style="color:var(--muted)">Prazo ${tk.due_at ? fmtDate(tk.due_at) : "-"}</p>
      ${tk.my_status === "rejected" && tk.submission?.result_note ? `<div class="error">${escapeHtml(tk.submission.result_note)}</div>` : ""}
      ${tk.my_status === "approved" ? `<div class="okmsg">${escapeHtml(tk.submission?.result_note || "Tarefa aprovada.")}</div>` : ""}
      <a class="btn btn-primary btn-sm" href="#/app/curso/${tk.training_id}">${tk.my_status === "pending" || tk.my_status === "rejected" ? "Responder no curso" : "Abrir treinamento"}</a>
    </article>`).join("") || "<div class='card'>Nenhuma tarefa vinculada aos seus treinamentos.</div>"}</div>
  `;
}

async function companyProgress(view) {
  const rows = await api("/api/company/progress");
  view.innerHTML = `<div class="card"><table class="table">
    <tr><th>Colaborador</th><th>Treinamento</th><th>Status</th><th>Progresso</th></tr>
    ${rows.map((r) => `<tr><td>${escapeHtml(r.user_name)}</td><td>${escapeHtml(r.training_title)}</td><td>${r.status}</td><td><div class="progress"><span style="width:${r.progress}%"></span></div></td></tr>`).join("")}
  </table></div>`;
}

async function companyAttempts(view) {
  const rows = await api("/api/company/attempts");
  view.innerHTML = `<div class="card"><table class="table">
    <tr><th>Colaborador</th><th>Avaliacao</th><th>Nota</th><th>Resultado</th><th>Data</th></tr>
    ${rows.map((r) => `<tr><td>${escapeHtml(r.user_name)}</td><td>${escapeHtml(r.training_title)}</td><td>${r.score}%</td><td><span class="badge ${r.passed ? "badge-ok" : "badge-warn"}">${r.passed ? "Aprovado" : "Reprovado"}</span></td><td>${fmtDate(r.created_at)}</td></tr>`).join("")}
  </table></div>`;
}

async function companyReports(view) {
  const d = await api("/api/company/reports");
  const dash = await api("/api/company/dashboard");
  const rate = d.completionRate.total ? Math.round((d.completionRate.completed / d.completionRate.total) * 100) : 0;
  view.innerHTML = `
    <div class="kpis">
      <div class="card kpi"><span>Taxa de conclusao</span><b>${rate}%</b></div>
      <div class="card kpi"><span>Inscricoes</span><b>${d.completionRate.total || 0}</b></div>
      <div class="card kpi"><span>Certificados</span><b>${dash.stats.certificates}</b></div>
      <div class="card kpi"><span>Colaboradores</span><b>${dash.stats.collaborators}</b></div>
    </div>
    <div class="card">
      <h3>Media das avaliacoes</h3>
      <div class="chart">${d.scores.map((s) => `<div class="bar" style="height:${s.avg_score}%"><span>${s.avg_score}%</span></div>`).join("") || ""}</div>
      <table class="table">${d.scores.map((s) => `<tr><td>${escapeHtml(s.title)}</td><td>${s.avg_score}%</td><td>${s.attempts} tentativas</td></tr>`).join("")}</table>
    </div>
  `;
}

render();

let uid = 0;
new MutationObserver(() => {
  document.querySelectorAll(".progress").forEach((p) => {
    p.setAttribute("role", "progressbar");
    p.setAttribute("aria-valuemin", "0");
    p.setAttribute("aria-valuemax", "100");
    p.setAttribute("aria-valuenow", parseInt(p.firstElementChild?.style.width) || 0);
  });
  document.querySelectorAll(".error:not([role])").forEach((e) => e.setAttribute("role", "alert"));
  document.querySelectorAll("label + input:not([id]), label + select:not([id]), label + textarea:not([id])").forEach((f) => {
    f.id = "f" + ++uid;
    f.previousElementSibling.htmlFor = f.id;
  });
  document.querySelectorAll("input[placeholder]:not([aria-label]), textarea[placeholder]:not([aria-label])").forEach((f) => {
    if (!f.labels || !f.labels.length) f.setAttribute("aria-label", f.placeholder);
  });
}).observe(document.body, { childList: true, subtree: true });
