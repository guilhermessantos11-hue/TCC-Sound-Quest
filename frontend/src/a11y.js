const VL = "https://vlibras.gov.br/app";
let vlLoaded = false;

export function announce(msg) {
  let r = document.getElementById("sq-live");
  if (!r) {
    r = document.createElement("div");
    r.id = "sq-live";
    r.className = "sr-only";
    r.setAttribute("aria-live", "polite");
    document.body.appendChild(r);
  }
  r.textContent = "";
  setTimeout(() => (r.textContent = msg), 50);
}

// VLibras: tradutor oficial Português -> Libras (governo federal). Usa avatar 3D; é tradução automática.
export function setLibras(on) {
  let host = document.querySelector("[vw]");
  if (on && !host) {
    host = document.createElement("div");
    host.setAttribute("vw", "");
    host.className = "enabled";
    host.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(host);
  }
  if (host) host.style.display = on ? "" : "none";
  if (on && !vlLoaded) {
    vlLoaded = true;
    const s = document.createElement("script");
    s.src = VL + "/vlibras-plugin.js";
    s.onload = () => new window.VLibras.Widget(VL);
    s.onerror = () => {
      vlLoaded = false;
      announce("Não foi possível carregar o VLibras. Verifique a conexão com a internet.");
    };
    document.body.appendChild(s);
  }
}

export function mountToolbar(state, apply) {
  const bar = document.createElement("div");
  bar.className = "a11y-bar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Recursos de acessibilidade");
  const items = [
    ["contrast", "Contraste", "Alto contraste"],
    ["minus", "A−", "Diminuir texto"],
    ["plus", "A+", "Aumentar texto"],
    ["motion", "Sem animação", "Reduzir animações"],
    ["libras", "Libras", "Tradutor VLibras e apoio em Libras"]
  ];
  bar.innerHTML = items.map(([k, t, l]) => `<button type="button" data-k="${k}" aria-label="${l}">${t}</button>`).join("");
  const refresh = () => {
    bar.querySelector('[data-k="contrast"]').setAttribute("aria-pressed", !!state.a11y.contrast);
    bar.querySelector('[data-k="motion"]').setAttribute("aria-pressed", !!state.a11y.motion);
    bar.querySelector('[data-k="libras"]').setAttribute("aria-pressed", !!state.a11y.libras);
  };
  bar.onclick = (e) => {
    const k = e.target.closest("button")?.dataset.k;
    if (!k) return;
    if (["contrast", "plus", "minus"].includes(k)) window.sqA11y(k);
    else {
      state.a11y[k] = !state.a11y[k];
      apply();
    }
    refresh();
  };
  window.sqRefreshBar = refresh;
  document.body.appendChild(bar);
  refresh();
}
