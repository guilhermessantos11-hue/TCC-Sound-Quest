# SOUND QUEST

Plataforma corporativa de capacitação industrial acessível para pessoas com deficiência auditiva.

## Descrição da aplicação

O Sound Quest é uma plataforma web de treinamentos corporativos voltada ao ambiente industrial. Empresas cadastram e acompanham capacitações, e colaboradores as realizam em uma interface pensada para pessoas com deficiência auditiva, com Libras, legendas, alto contraste, fonte ajustável e tradução de alarmes sonoros em sinais visuais e táteis.

## Objetivo

Garantir que colaboradores com deficiência auditiva tenham acesso igualitário a treinamentos e informações de segurança do trabalho (como NR-12 e LOTO), reduzindo barreiras de comunicação e riscos de acidente no ambiente industrial.

## Tecnologias utilizadas

- *Frontend:* HTML, CSS e JavaScript (Vite)
- *Backend:* Node.js, Express, JWT, SQLite (better-sqlite3)
- *Acessibilidade:* VLibras, legendas, alto contraste e fonte ajustável

## Como instalar

Pré-requisito: Node.js (versão LTS recomendada) e npm instalados.

bash
npm run install:all


## Como executar

bash
npm start


- Frontend: http://localhost:5173
- API: http://localhost:3001

### Contas de teste

Senha: 123456

- Empresa: empresa@soundquest.com
- Colaborador: joao@soundquest.com

Qualquer usuário cadastrado entra pela mesma tela, com e-mail e senha. Após o login, o sistema abre o dashboard do perfil correspondente. Use *Esqueceu a senha?* para iniciar a recuperação segura.

> *Atenção:* essas contas e a senha de teste servem apenas para desenvolvimento. Não devem existir em produção.

## Estrutura do projeto


SOUND-QUEST/
├── frontend/   # Interface (Vite)
├── backend/    # API (Express, JWT, SQLite)
└── docs/
    ├── estrutura-projeto.md
    └── api.md


Detalhes em docs/estrutura-projeto.md e docs/api.md.

## Funcionalidades principais

- Login único por e-mail e senha, com abertura automática do dashboard do perfil (empresa ou colaborador).
- Recuperação segura de senha.
- Barra de acessibilidade com VLibras, legendas, alto contraste e fonte ajustável.
- Sinais da fábrica (#/app/sinais): alarmes sonoros traduzidos em cor, ritmo e vibração.
- Capacitações de segurança do trabalho (NR-12, LOTO).

## Libras e acessibilidade

- *VLibras* (tradutor oficial do governo, avatar 3D) é carregado pela barra de acessibilidade. É tradução automática do português e exige internet.
- *Sinais da fábrica:* alarmes sonoros traduzidos em cor, ritmo e vibração.

## Integrantes

- Ana Victoria
- Benjamim Santana
- Guilherme de Souza
- Winie de Jesus
- Tainá da Silva

## Instituição

SENAI Candeias

## Professor orientador

Adalberto Santana

##SLIDE
https://canva.link/h839kvnbpk1fikd
