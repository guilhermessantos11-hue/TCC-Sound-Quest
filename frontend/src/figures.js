const P = (i, x, label, sub, art) => `<g transform="translate(${x} 0)"><rect x="2" y="2" width="164" height="206" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="26" cy="28" r="16" fill="#ffc400" stroke="#111" stroke-width="3"/><text x="26" y="34" text-anchor="middle" font-size="18" font-weight="800" fill="#111">${i}</text>${art}<text x="84" y="170" text-anchor="middle" font-size="19" font-weight="800" fill="#111">${label}</text><text x="84" y="192" text-anchor="middle" font-size="12.5" fill="#333">${sub}</text></g>`;

const loto = () => `<svg viewBox="0 0 700 212" role="img" aria-labelledby="t1 d1" style="width:100%;height:auto;font-family:inherit"><title id="t1">Bloqueio e etiquetagem em 4 passos</title><desc id="d1">Sequência de quatro pictogramas: 1 interruptor desligado, 2 cadeado aplicado, 3 etiqueta NÃO OPERAR, 4 olho conferindo que não há energia.</desc>
${P(1, 0, "Desligue", "Isole a energia",
  '<rect x="54" y="50" width="60" height="78" rx="4" fill="#eee" stroke="#111" stroke-width="4"/><path d="M84 106V70" stroke="#111" stroke-width="9" stroke-linecap="round"/><circle cx="84" cy="66" r="9" fill="#d62e1f" stroke="#111" stroke-width="3"/><text x="84" y="122" text-anchor="middle" font-size="12" font-weight="800">OFF</text>')}
${P(2, 178, "Bloqueie", "Só você tem a chave",
  '<path d="M66 92V78a18 18 0 0 1 36 0v14" fill="none" stroke="#111" stroke-width="9"/><rect x="54" y="90" width="60" height="46" rx="4" fill="#111"/><circle cx="84" cy="110" r="6" fill="#ffc400"/><path d="M84 114v10" stroke="#ffc400" stroke-width="5"/>')}
${P(3, 356, "Sinalize", "Etiqueta no ponto",
  '<path d="M46 62h66l20 30-20 30H46z" fill="#ffc400" stroke="#111" stroke-width="4"/><circle cx="60" cy="92" r="5" fill="#fff" stroke="#111" stroke-width="2"/><text x="92" y="88" text-anchor="middle" font-size="12" font-weight="800">NÃO</text><text x="92" y="104" text-anchor="middle" font-size="12" font-weight="800">OPERAR</text>')}
${P(4, 534, "Verifique", "Teste: sem energia",
  '<path d="M30 92q54-52 108 0q-54 52-108 0z" fill="#fff" stroke="#111" stroke-width="5"/><circle cx="84" cy="92" r="16" fill="#111"/><circle cx="79" cy="87" r="4" fill="#fff"/><path d="M62 132l14 12 30-28" fill="none" stroke="#1e7b4f" stroke-width="7" stroke-linecap="round"/>')}
</svg>`;

const riscos = () => `<svg viewBox="0 0 700 300" role="img" aria-labelledby="t2 d2" style="width:100%;height:auto;font-family:inherit"><title id="t2">Mapa de riscos de uma linha de produção</title><desc id="d2">Vista de cima. No centro, a máquina com zona de perigo hachurada e proteção fixa ao redor. Abaixo, corredor seguro liso. Um botão de emergência E fica ao lado da máquina, dentro do alcance do operador.</desc>
<defs><pattern id="hz" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="12" fill="#d62e1f"/><rect x="6" width="6" height="12" fill="#fff"/></pattern></defs>
<rect x="2" y="2" width="696" height="296" fill="#f3f1ea" stroke="#111" stroke-width="3"/>
<rect x="150" y="30" width="260" height="150" fill="url(#hz)" stroke="#111" stroke-width="3"/>
<rect x="195" y="65" width="170" height="80" fill="#555" stroke="#111" stroke-width="3"/><text x="280" y="112" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">MÁQUINA</text>
<path d="M150 30H410V180H150Z" fill="none" stroke="#111" stroke-width="7" stroke-dasharray="0"/>
<rect x="40" y="215" width="620" height="55" fill="#cfe8d9" stroke="#1e7b4f" stroke-width="3"/><text x="350" y="249" text-anchor="middle" font-size="18" font-weight="800" fill="#0d4a2e">CORREDOR SEGURO</text>
<circle cx="440" cy="105" r="20" fill="#d62e1f" stroke="#111" stroke-width="4"/><text x="440" y="112" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">E</text>
<g font-size="14" fill="#111"><rect x="480" y="30" width="26" height="26" fill="url(#hz)" stroke="#111" stroke-width="2"/><text x="516" y="49">Zona de perigo: não entre</text><rect x="480" y="66" width="26" height="12" fill="none" stroke="#111" stroke-width="7"/><text x="516" y="78">Proteção fixa</text><circle cx="493" cy="105" r="11" fill="#d62e1f" stroke="#111" stroke-width="2"/><text x="516" y="110">Botão de emergência</text><rect x="480" y="128" width="26" height="22" fill="#cfe8d9" stroke="#1e7b4f" stroke-width="2"/><text x="516" y="145">Área segura</text></g></svg>`;

const map = { "Procedimento visual de bloqueio": loto, "Mapa visual de riscos": riscos };
export const figureFor = (title) => (map[title] ? map[title]() : null);
