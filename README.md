# SOUND QUEST

Plataforma corporativa de capacitacao industrial acessivel para pessoas com deficiencia auditiva.

## Como executar

```bash
npm run install:all
npm start
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

## Contas de teste

Senha: `123456`

- Empresa: `empresa@soundquest.com`
- Colaborador: `joao@soundquest.com`

## Stack

- Frontend: HTML, CSS e JavaScript (Vite)
- Backend: Node.js, Express, JWT, SQLite (`better-sqlite3`)
- Acessibilidade: Libras, legendas, alto contraste e fonte ajustavel

Documentacao complementar em `docs/estrutura-projeto.md` e `docs/api.md`.

## Libras e acessibilidade: o que o código faz e o que falta

- **VLibras** (tradutor oficial do governo, avatar 3D) é carregado pela barra de acessibilidade. É tradução automática do português; exige internet.
- **Conteúdo crítico de segurança (NR-12, LOTO)** deve ter vídeo com intérprete de Libras e legendas revisadas por humanos. Falta produzir esse material para `loto-bloqueio.mp4`.
- **Sinais da fábrica** (`#/app/sinais`): alarmes sonoros traduzidos em cor, ritmo e vibração. Os padrões são exemplos; validar com a SST da empresa.
