const POSES = {
  intro: {
    label: "Apoio em Libras",
    caption: "Os sinais desta página também estão descritos em texto. Use a janela para acompanhar o conteúdo em destaque."
  },
  emergencia: {
    label: "Emergência",
    caption: "Pare tudo e afaste-se da área. Não religue nada."
  },
  anormal: {
    label: "Condição anormal",
    caption: "Não se aproxime. Avise o líder ou a SST."
  },
  acao: {
    label: "Ação obrigatória",
    caption: "A máquina espera o operador. Faça a liberação ou o reinício."
  },
  normal: {
    label: "Operação normal",
    caption: "Área liberada. Mantenha as proteções no lugar."
  },
  empilhadeira: {
    label: "Empilhadeira se aproximando",
    caption: "Saia da rota e olhe para os lados antes de atravessar."
  }
};

function portrait() {
  return `<svg viewBox="0 0 200 280" role="img" aria-hidden="true" class="intp-svg">
    <title>Intérprete negra de apoio em Libras</title>
    <rect width="200" height="280" rx="16" fill="#eef6f1"/>
    <ellipse cx="100" cy="268" rx="70" ry="10" fill="#d7e8de"/>
    <path d="M62 176h76c18 0 32 22 32 48v56H30v-56c0-26 14-48 32-48z" fill="#0f7a4a"/>
    <path d="M70 176h60v18c0 10-12 16-30 16s-30-6-30-16z" fill="#0b5c3a"/>
    <path d="M78 168c-18 16-30 38-32 62" fill="none" stroke="#5c3a2e" stroke-width="14" stroke-linecap="round"/>
    <path d="M122 168c18 16 30 38 32 62" fill="none" stroke="#5c3a2e" stroke-width="14" stroke-linecap="round"/>
    <ellipse cx="44" cy="228" rx="16" ry="12" fill="#5c3a2e"/>
    <ellipse cx="156" cy="228" rx="16" ry="12" fill="#5c3a2e"/>
    <circle cx="100" cy="102" r="44" fill="#5c3a2e"/>
    <path d="M56 96c4-38 28-62 44-62s40 24 44 62c-10-14-26-22-44-22s-34 8-44 22z" fill="#1a120c"/>
    <circle cx="62" cy="108" r="14" fill="#1a120c"/>
    <circle cx="138" cy="108" r="14" fill="#1a120c"/>
    <circle cx="100" cy="58" r="18" fill="#1a120c"/>
    <ellipse cx="86" cy="104" rx="5" ry="6" fill="#1a120c"/>
    <ellipse cx="114" cy="104" rx="5" ry="6" fill="#1a120c"/>
    <circle cx="84" cy="102" r="1.6" fill="#f4ece4"/>
    <circle cx="112" cy="102" r="1.6" fill="#f4ece4"/>
    <path d="M78 88q9-4 18 0" fill="none" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
    <path d="M104 88q9-4 18 0" fill="none" stroke="#1a120c" stroke-width="3" stroke-linecap="round"/>
    <path d="M98 104l-4 12 8 2z" fill="#4a2e24"/>
    <path d="M90 118q10 8 20 0" fill="none" stroke="#3d2314" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

export function mountInterprete(view) {
  document.getElementById("sq-interprete")?.remove();
  const wrap = document.createElement("aside");
  wrap.id = "sq-interprete";
  wrap.className = "intp-widget";
  wrap.setAttribute("role", "complementary");
  wrap.setAttribute("aria-label", "Intérprete de apoio em Libras");
  wrap.innerHTML = `
    <div class="intp-panel" id="intp-panel">
      <header class="intp-head">
        <p class="intp-kicker">Intérprete de apoio</p>
        <div class="intp-actions">
          <button type="button" class="intp-btn" id="intp-min" aria-label="Minimizar intérprete">Minimizar</button>
          <button type="button" class="intp-btn" id="intp-close" aria-label="Fechar intérprete">Fechar</button>
        </div>
      </header>
      <div class="intp-stage">${portrait()}</div>
      <p class="intp-name" id="intp-name">Apoio em Libras</p>
      <p class="intp-caption" id="intp-caption" aria-live="polite">${POSES.intro.caption}</p>
      <p class="intp-note">Esta janela não traduz a página automaticamente. O texto do sinal em destaque aparece aqui. Para interpretação em Libras, use o botão Libras na barra de acessibilidade (VLibras).</p>
    </div>
    <button type="button" class="intp-fab" id="intp-open" hidden aria-label="Abrir intérprete de Libras">
      <span>Libras</span>
    </button>
  `;
  document.body.appendChild(wrap);
  view.classList.add("has-interprete");

  const panel = wrap.querySelector("#intp-panel");
  const fab = wrap.querySelector("#intp-open");
  const setMode = (mode) => {
    wrap.dataset.mode = mode;
    panel.hidden = mode !== "open";
    fab.hidden = mode === "open";
    view.classList.toggle("has-interprete", mode === "open");
  };
  wrap.querySelector("#intp-min").onclick = () => setMode("min");
  wrap.querySelector("#intp-close").onclick = () => {
    setMode("closed");
    view.classList.remove("has-interprete");
  };
  fab.onclick = () => setMode("open");
  setMode("open");

  wrap._setPose = (key) => {
    const pose = POSES[key] || POSES.intro;
    wrap.querySelector("#intp-name").textContent = pose.label;
    wrap.querySelector("#intp-caption").textContent = pose.caption;
  };
  return wrap;
}

export function updateInterprete(key) {
  document.getElementById("sq-interprete")?._setPose?.(key);
}

export function unmountInterprete() {
  document.getElementById("sq-interprete")?.remove();
}
