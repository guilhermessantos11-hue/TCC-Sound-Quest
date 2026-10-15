# SOUND QUEST

Plataforma corporativa de capacitação industrial acessível para pessoas com deficiência auditiva.

## Como executar

Pré-requisito: Node.js (versão LTS recomendada) e npm instalados.

bash
npm run install:all
npm start


- Frontend: http://localhost:5173
- API: http://localhost:3001

## Contas de teste

Senha: 123456

- Empresa: empresa@soundquest.com
- Colaborador: joao@soundquest.com

Qualquer usuário cadastrado entra pela mesma tela, com e-mail e senha. Após o login, o sistema abre o dashboard do perfil correspondente. Use Esqueceu a senha?para iniciar a recuperação segura.

> *Atenção:* essas contas e a senha de teste servem apenas para desenvolvimento. Não devem existir em produção.

Stack

- Frontend:HTML, CSS e JavaScript (Vite)
- Backend: Node.js, Express, JWT, SQLite (better-sqlite3)
- Acessibilidade: Libras, legendas, alto contraste e fonte ajustável

Documentação complementar

- docs/estrutura-projeto.md
- docs/api.md

## Libras e acessibilidade: o que o código faz e o que falta

O que o código faz

- VLibras (tradutor oficial do governo, com avatar 3D) é carregado pela barra de acessibilidade. É tradução automática do português e exige conexão com a internet.
- *Sinais da fábrica* (#/app/sinais): alarmes sonoros traduzidos em cor, ritmo e vibração.

 O que falta

- Conteúdo crítico de segurança (NR-12, LOTO)** deve ter vídeo com intérprete de Libras e legendas revisadas por humanos. Falta produzir esse material para loto-bloqueio.mp4.
- *Padrões dos sinais da fábrica:* os padrões atuais são apenas exemplos e devem ser validados com a SST da empresa antes de qualquer uso real.

### Limitações importantes

- O VLibras não substitui intérprete humano em conteúdo de segurança.
- Um alarme interpretado de forma errada pode causar acidente, por isso nenhum padrão de sinal deve ser usado em campo sem validação da SST.
-
