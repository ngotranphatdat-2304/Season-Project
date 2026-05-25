# Season

Season is a full-stack eyewear project with:

- a `Next.js` frontend in `frontend/`
- an `Express + MongoDB` backend in `backend/`
- a `docker-compose.yml` file at the repo root for local MongoDB

This README is the main setup guide for the project.

## Tech Stack

- Frontend: `Next.js 16`, `React 19`, `TypeScript`, `Tailwind CSS`
- Backend: `Express 5`, `Mongoose`, `TypeScript`
- Database: `MongoDB` via Docker

## Prerequisites

Install these first:

- `Node.js >= 20.9.0`
- `npm`
- `Docker`
- `Docker Compose`

Check your versions:

```bash
node -v
npm -v
docker -v
docker compose version
```

## Repository Structure

```text
season/
├── backend/              # Express API + MongoDB models
├── frontend/             # Next.js app
├── docker-compose.yml    # Local MongoDB
├── MONGODB_SETUP.md
└── README.md
```

## Environment Files

This project uses local env files that are intentionally not committed to Git.
The env files are already shared separately between teammates.

Put each shared env file in the correct folder before starting the project.

### Frontend

Put the shared frontend env file here:

```text
frontend/.env.local
```

This file belongs inside the `frontend/` folder.

The frontend reads at least:

```env
API_URL=http://localhost:3001
```

### Backend

Put the shared backend env file here:

```text
backend/.env.backend
```

This file belongs inside the `backend/` folder.

The backend reads:

- `MONGO_URI`
- `MONGO_DB`
- `PORT`
- `ALLOWED_ORIGIN` or comma-separated `ALLOWED_ORIGINS`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUDINARY_URL` if you are using media operations that depend on it

## Initial Setup

Do these steps first on a fresh machine.

### 1. Install Dependencies

Install dependencies separately for frontend and backend.

#### Frontend

```bash
cd frontend
npm install
```

#### Backend

```bash
cd backend
npm install
```

If you want to install both from the project root, run:

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Place The Shared Env Files

Put the shared env files in these locations:

```text
frontend/.env.local
backend/.env.backend
```

### 3. Start MongoDB With Docker

From the project root where `docker-compose.yml` is located:

```bash
docker compose up -d
```

This starts the local MongoDB container defined in `docker-compose.yml`.

Useful commands:

```bash
docker compose ps
docker compose logs mongodb
docker compose down
docker compose down -v
```

If you want a clean Mongo reset:

```bash
docker compose down -v
docker compose up -d
```

### 4. Seed The Database

After MongoDB is running, seed the backend data:

```bash
cd backend
ALLOW_DESTRUCTIVE_SEED=true npm run seed
```

Important notes:

- `npm run seed` clears the current database before inserting fresh data and requires `ALLOW_DESTRUCTIVE_SEED=true`
- seed reads from `season_data/`
- run it again whenever you want to reset the local database to the normalized project data

## Backend

Once the initial setup is done, run the backend from the `backend/` folder:

```bash
cd backend
npm run dev
```

Default backend URL:

```text
http://localhost:3001
```

Useful backend scripts:

```bash
npm run dev
npm run build
npm run start
npm run normalize
npm run normalize:sunglasses
npm run normalize:eyeglasses
npm run seed
```

## Frontend

Once the backend is already running, start the frontend from the `frontend/` folder:

```bash
cd frontend
npm run dev
```

Default frontend URL:

```text
http://localhost:3000
```

Useful frontend scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

The frontend expects the backend API to be available at the URL defined in `frontend/.env.local`.

## Recommended Startup Order

Use this order for local development:

1. Install frontend and backend dependencies
2. Put the shared env files in `backend/.env.backend` and `frontend/.env.local`
3. Start MongoDB with Docker
4. Seed the backend data with `cd backend && ALLOW_DESTRUCTIVE_SEED=true npm run seed`
5. Start the backend
6. Start the frontend
7. Open `http://localhost:3000`

## Build For Production

### Backend

```bash
cd backend
npm run build
npm run start
```

### Frontend

```bash
cd frontend
npm run build
npm run start
```

## Common Problems

### Frontend says `ERR_CONNECTION_REFUSED`

Usually means the frontend dev server is not running on port `3000`.

Check:

```bash
cd frontend
npm run dev
```

### Next.js refuses to start because of Node version

This frontend uses `Next.js 16`, which requires `Node.js >= 20.9.0`.

If `node -v` is lower than that, upgrade Node first.

### Backend fails with `Please provide a MongoDB URI`

Your `backend/.env.backend` is missing or `MONGO_URI` is not set correctly.

### Backend starts but no products appear

Check these:

1. MongoDB is running
2. you already ran `cd backend && ALLOW_DESTRUCTIVE_SEED=true npm run seed`
3. the seed command finished without errors
4. the backend is pointing at the same MongoDB database you seeded

### Frontend loads but product API calls fail

Check these:

1. MongoDB is running
2. backend is running on `http://localhost:3001`
3. `frontend/.env.local` points to the correct backend URL
4. `backend/.env.backend` has the correct `ALLOWED_ORIGIN`

## Notes

- The root `package.json` is not the main app entrypoint for day-to-day development.
- For normal work, use `frontend/` and `backend/` directly.
- The root `docker-compose.yml` is only for MongoDB.
