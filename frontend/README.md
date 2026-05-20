# Frontend

Use the main project guide at:

`../README.md`

The frontend app lives in `frontend/`, but the full local setup also requires:

- MongoDB from the repo root `docker-compose.yml`
- the backend in `backend/`
- `frontend/.env.local`
- `backend/.env.backend`

The env files are shared separately with teammates and should be placed here:

- `frontend/.env.local`
- `backend/.env.backend`

For day-to-day frontend commands:

```bash
npm install
npm run dev
```
