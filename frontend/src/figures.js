const P = (i, x, label, sub, art) => `<g transform="translate(${x} 0)"><rect x="2" y="2" width="164" height="206" fill="#fff" stroke="#0B5C3A" stroke-width="2" rx="12"/><circle cx="26" cy="28" r="16" fill="#0F7A4A"/><text x="26" y="34" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">${i}</text>${art}<text x="84" y="170" text-anchor="middle" font-size="19" font-weight="800" fill="#0B5C3A">${label}</text><text x="84" y="192" text-anchor="middle" font-size="12.5" fill="#5C7368">${sub}</text></g>`;

const loto = () => `<svg viewBox="0 0 700 212" role="img" aria-labelledby="t1 d1" style="width:100%;height:auto;font-family:inherit"><title id="t1">Bloqueio e etiquetagem em 4 passos</title><desc id="d1">Sequencia de quatro pictogramas: 1 interruptor desligado, 2 cadeado aplicado, 3 etiqueta NAO OPERAR, 4 olho conferindo que nao ha energia.</desc>
${P(1, 0, "Desligue", "Isole a energia",
  '<rect x="54" y="50" width="60" height="78" rx="8" fill="#ffffff" stroke="#0B5C3A" stroke-width="3"/><path d="M84 106V70" stroke="#0B5C3A" stroke-width="9" stroke-linecap="round"/><circle cx="84" cy="66" r="9" fill="#0F7A4A"/><text x="84" y="122" text-anchor="middle" font-size="12" font-weight="800" fill="#0B5C3A">OFF</text>')}
${P(2, 178, "Bloqueie", "So voce tem a chave",
  '<path d="M66 92V78a18 18 0 0 1 36 0v14" fill="none" stroke="#0B5C3A" stroke-width="9"/><rect x="54" y="90" width="60" height="46" rx="6" fill="#0B5C3A"/><circle cx="84" cy="110" r="6" fill="#BBF7D0"/><path d="M84 114v10" stroke="#BBF7D0" stroke-width="5"/>')}
${P(3, 356, "Sinalize", "Etiqueta no ponto",
  '<path d="M46 62h66l20 30-20 30H46z" fill="#0F7A4A"/><circle cx="60" cy="92" r="5" fill="#fff"/><text x="92" y="88" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">NAO</text><text x="92" y="104" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">OPERAR</text>')}
${P(4, 534, "Verifique", "Teste: sem energia",
  '<path d="M30 92q54-52 108 0q-54 52-108 0z" fill="#fff" stroke="#0B5C3A" stroke-width="4"/><circle cx="84" cy="92" r="16" fill="#0B5C3A"/><circle cx="79" cy="87" r="4" fill="#fff"/><path d="M62 132l14 12 30-28" fill="none" stroke="#16a34a" stroke-width="7" stroke-linecap="round"/>')}
</svg>`;

const riscos = () => `<svg viewBox="0 0 700 300" role="img" aria-labelledby="t2 d2" style="width:100%;height:auto;font-family:inherit"><title id="t2">Mapa de riscos de uma linha de producao</title><desc id="d2">Vista de cima. No centro, a maquina com zona de perigo hachurada e protecao fixa ao redor. Abaixo, corredor seguro liso. Um botao de emergencia E fica ao lado da maquina, dentro do alcance do operador.</desc>
<defs><pattern id="hz" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="12" fill="#0F7A4A"/><rect x="6" width="6" height="12" fill="#fff"/></pattern></defs>
<rect x="2" y="2" width="696" height="296" fill="#ffffff" stroke="#0B5C3A" stroke-width="2" rx="12"/>
<rect x="150" y="30" width="260" height="150" fill="url(#hz)" stroke="#0B5C3A" stroke-width="2"/>
<rect x="195" y="65" width="170" height="80" fill="#0B5C3A"/><text x="280" y="112" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">MAQUINA</text>
<path d="M150 30H410V180H150Z" fill="none" stroke="#0B5C3A" stroke-width="6"/>
<rect x="40" y="215" width="620" height="55" fill="#dcfce7" stroke="#16a34a" stroke-width="2" rx="8"/><text x="350" y="249" text-anchor="middle" font-size="18" font-weight="800" fill="#0B5C3A">CORREDOR SEGURO</text>
<circle cx="440" cy="105" r="20" fill="#0F7A4A"/><text x="440" y="112" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">E</text>
<g font-size="14" fill="#0B5C3A"><rect x="480" y="30" width="26" height="26" fill="url(#hz)" stroke="#0B5C3A" stroke-width="1"/><text x="516" y="49">Zona de perigo: nao entre</text><rect x="480" y="66" width="26" height="12" fill="none" stroke="#0B5C3A" stroke-width="6"/><text x="516" y="78">Protecao fixa</text><circle cx="493" cy="105" r="11" fill="#0F7A4A"/><text x="516" y="110">Botao de emergencia</text><rect x="480" y="128" width="26" height="22" fill="#e8f6f1" stroke="#16a34a" stroke-width="2"/><text x="516" y="145">Area segura</text></g></svg>`;

const map = { "Procedimento visual de bloqueio": loto, "Mapa visual de riscos": riscos };
export const figureFor = (title) => (map[title] ? map[title]() : null);
