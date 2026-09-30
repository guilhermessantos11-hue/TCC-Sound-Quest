import { announce } from "./a11y.js";

const S = [
  { nome: "Emergência", cor: "Vermelho", padrao: "Pisca muito rápido", acao: "Pare tudo e afaste-se da área. Não religue nada.", vib: [600, 200, 600, 200, 600], css: "red fast" },
  { nome: "Condição anormal", cor: "Amarelo", padrao: "Pisca devagar", acao: "Não se aproxime. Avise o líder ou a SST.", vib: [250, 150, 250], css: "yellow slow" },
  { nome: "Ação obrigatória", cor: "Azul", padrao: "Luz fixa", acao: "A máquina espera o operador (liberação ou reinício).", vib: [120, 100, 120, 100, 120], css: "blue fixed" },
  { nome: "Operação normal", cor: "Verde", padrao: "Luz fixa", acao: "Área liberada. Mantenha as proteções no lugar.", vib: [80], css: "green fixed" },
  { nome: "Empilhadeira se aproximando", cor: "Ponto azul no chão", padrao: "Luz projetada no piso", acao: "Saia da rota e olhe para os lados antes de atravessar.", vib: [150, 80, 150, 80, 400], css: "blue floor" }
];

const beacon = (s) => `<div class="beacon ${s.css}" aria-hidden="true"><i></i></div>`;

export async function signalsView(view) {
  view.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="kicker">Conceito</div>
      <h3>Na fábrica o aviso é sonoro. Aqui ele vira cor, ritmo e vibração.</h3>
      <p>Sirenes e buzinas não chegam a quem não ouve. Estes são os sinais visuais que você precisa reconhecer. As cores seguem a convenção de sinalização de máquinas (IEC 60204-1, referência da NR-12); <b>cada planta define o próprio padrão, então confirme com a SST da sua empresa.</b> Os ritmos abaixo são exemplos de treino.</p>
    </div>
    <div class="sig-grid">${S.map((s, i) => `<article class="card sig">${beacon(s)}<div><h3>${s.nome}</h3><p><b>${s.cor} · ${s.padrao}</b></p><p>${s.acao}</p><button type="button" class="btn btn-ghost btn-sm" data-vib="${i}">Sentir vibração</button></div></article>`).join("")}</div>
    <section class="card" id="desafio" style="margin-top:16px" aria-labelledby="dh"></section>`;
  view.querySelectorAll("[data-vib]").forEach((b) => {
    b.onclick = () => {
      if (navigator.vibrate) navigator.vibrate(S[b.dataset.vib].vib);
      else announce("Este aparelho não vibra. Use a cor e o ritmo da luz.");
    };
  });

  const box = document.getElementById("desafio");
  let last = -1, hits = 0, total = 0;
  const draw = () => {
    let i;
    do i = Math.floor(Math.random() * S.length); while (i === last);
    last = i;
    const opts = [...S].sort(() => Math.random() - 0.5).slice(0, 4);
    if (!opts.includes(S[i])) opts[0] = S[i];
    opts.sort(() => Math.random() - 0.5);
    box.innerHTML = `<div class="kicker">Desafio</div><h3 id="dh">O que este sinal quer dizer?</h3>
      <div class="quiz-sig">${beacon(S[i])}<p><b>Cor:</b> ${S[i].cor}<br><b>Ritmo:</b> ${S[i].padrao}</p></div>
      <div class="opts">${opts.map((o) => `<button type="button" class="btn btn-ghost" data-n="${o.nome}">${o.nome}</button>`).join("")}</div>
      <div id="fb" role="status" aria-live="polite"></div>
      <p>Acertos: ${hits} de ${total}</p>`;
    box.querySelectorAll("[data-n]").forEach((b) => {
      b.onclick = () => {
        total += 1;
        const ok = b.dataset.n === S[i].nome;
        if (ok) hits += 1;
        box.querySelectorAll("[data-n]").forEach((x) => (x.disabled = true));
        document.getElementById("fb").innerHTML = `<div class="${ok ? "okmsg" : "error"}"><b>${ok ? "Correto" : "Ainda não"}: ${S[i].nome}.</b> ${S[i].acao}</div><button type="button" class="btn btn-primary" id="nx" style="margin-top:12px">Próximo sinal</button>`;
        if (navigator.vibrate && ok === false) navigator.vibrate([200]);
        document.getElementById("nx").onclick = draw;
        document.getElementById("nx").focus();
      };
    });
  };
  draw();
}
