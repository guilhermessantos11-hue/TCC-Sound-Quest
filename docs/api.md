# API REST - SOUND QUEST

Base: `/api` (proxy do Vite para `http://127.0.0.1:3001`)

Autenticacao: header `Authorization: Bearer <token>`

## Autenticacao

- `POST /auth/login` — qualquer usuario cadastrado (colaborador ou gestor)
- `POST /auth/register`
- `POST /auth/forgot-password` — inicia recuperacao segura (token de 1h, uso unico)
- `POST /auth/reset-password` — redefine senha com o token
- `GET /me`
- `PUT /me`

## Colaborador

- `GET /collaborator/dashboard`
- `GET /trainings`
- `GET /trainings/:id`
- `POST /trainings/:id/enroll`
- `POST /contents/:id/complete`
- `POST /activities/:id/check` — feedback imediato (correto/incorreto)
- `POST /activities/:id/submit` — envia atividade de modulo ou avaliacao final
- `GET /certificates`
- `GET /certificates/:id`

## Empresa

- `GET /company/dashboard`
- `GET|POST /company/collaborators`
- `PUT|DELETE /company/collaborators/:id`
- `GET|POST /company/trainings`
- `PUT|DELETE /company/trainings/:id`
- `POST /company/trainings/:id/modules`
- `PUT|DELETE /company/modules/:id`
- `POST /company/modules/:id/contents`
- `PUT|DELETE /company/contents/:id`
- `POST /company/trainings/:id/activity`
- `GET /company/progress`
- `GET /company/attempts`
- `GET /company/reports`
- `GET|POST /company/tasks`
- `GET|PUT|DELETE /company/tasks/:id`
- `POST /company/trainings/:id/tasks/generate`
- `POST /company/tasks/:id/review`

## Tarefas do treinamento

- `GET /collaborator/tasks`
- `POST /tasks/:id/submit`
