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

Qualquer usuario cadastrado entra pela mesma tela, com e-mail e senha. Apos o login, o sistema abre o dashboard do perfil correspondente. Use **Esqueceu a senha?** para iniciar a recuperacao segura.

## Stack

- Frontend: HTML, CSS e JavaScript (Vite)
- Backend: Node.js, Express, JWT, SQLite (`better-sqlite3`)
- Acessibilidade: Libras, legendas, alto contraste e fonte ajustavel

Documentacao complementar em `docs/estrutura-projeto.md` e `docs/api.md`.

## Libras e acessibilidade: o que o codigo faz e o que falta

- **VLibras** (tradutor oficial do governo, avatar 3D) e carregado pela barra de acessibilidade. E traducao automatica do portugues; exige internet.
- **Conteudo critico de seguranca (NR-12, LOTO)** deve ter video com interprete de Libras e legendas revisadas por humanos. Falta produzir esse material para `loto-bloqueio.mp4`.
- **Sinais da fabrica** (`#/app/sinais`): alarmes sonoros traduzidos em cor, ritmo e vibracao. Os padroes sao exemplos; validar com a SST da empresa.
