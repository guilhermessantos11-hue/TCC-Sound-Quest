# Estrutura academica do SOUND QUEST

Plataforma corporativa de capacitacao industrial acessivel, com apoio de Libras, legendas e alto contraste.

## Pastas

```
sound-quest/
  backend/                 API Node.js + Express + SQLite
    config/database.js     Conexao e criacao das tabelas
    controllers/           Regras de negocio por dominio
    routes/                Endpoints REST
    src/server.js          Bootstrap da API (porta 3001)
    src/seed.js            Dados de demonstracao
    data/                  Banco SQLite gerado em runtime
  frontend/                SPA Vite (HTML, CSS e JavaScript)
    src/main.js            Rotas, telas e interacoes
    src/api.js             Cliente HTTP com JWT
    src/styles.css         Identidade visual e acessibilidade
    assets/                Icones, imagens e videos
  database/schema.sql      Modelo relacional documentado
  docs/                    Documentacao academica
  start.js                 Sobe API e frontend juntos
```

## Controllers (backend)

| Arquivo | Responsabilidade |
|---|---|
| `authController.js` | Login, cadastro, sessao JWT e perfil |
| `funcionarioController.js` | Colaboradores, dashboards e relatorios |
| `treinamentoController.js` | Catalogo, inscricao e CRUD de treinamentos |
| `moduloController.js` | Modulos, conteudos e conclusao de aulas |
| `avaliacaoController.js` | Questoes, tentativas e nota minima |
| `certificadoController.js` | Progresso, emissao e consulta de certificados |

## Telas (frontend)

- Login e cadastro (empresa ou colaborador)
- Dashboard do colaborador (progresso, catalogo, certificados)
- Player de treinamento (texto, imagem, video com legendas e Libras)
- Avaliacao objetiva e resultado
- Painel da empresa (colaboradores, treinamentos, progresso e relatorios)

## Contas de demonstracao

Senha padrao: `123456`

- Empresa: `empresa@soundquest.com`
- Colaborador: `joao@soundquest.com`
