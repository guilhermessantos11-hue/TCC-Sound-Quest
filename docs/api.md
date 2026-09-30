# API REST - SOUND QUEST

Base: `/api` (proxy do Vite para `http://127.0.0.1:3001`)

Autenticacao: header `Authorization: Bearer <token>`

## Autenticacao

- `POST /auth/login`
- `POST /auth/register`
- `GET /me`
- `PUT /me`

## Colaborador

- `GET /collaborator/dashboard`
- `GET /trainings`
- `GET /trainings/:id`
- `POST /trainings/:id/enroll`
- `POST /contents/:id/complete`
- `POST /activities/:id/submit`
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
