# Season

Season is a full-stack eyewear project.

- Frontend: `frontend/` with Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: `backend/` with Spring Boot 4, Java 17+, Spring Data MongoDB
- Database: MongoDB, either remote Atlas or local MongoDB
- Docker: optional, only for running a local MongoDB container

## Does The Backend Need Docker?

No, not when `backend/.env` points `MONGO_URI` to a remote MongoDB instance such as MongoDB Atlas.

The backend needs a reachable MongoDB database. Docker is only one local development option for that database. If `MONGO_URI` is `mongodb+srv://...`, you can run the backend without Docker.

Use Docker only if you want to run MongoDB locally through `docker-compose.yml`.

## Prerequisites

Install:

- Java JDK 17+
- Node.js 20.9+
- npm
- Docker Desktop, optional for local MongoDB only

Check versions:

```bash
java -version
node -v
npm -v
docker -v
```

## Environment Files

This project uses local env/properties files that are intentionally not committed to Git.
The configuration files are already shared separately between teammates.

Put each shared config file in the correct folder before starting the project.

### Frontend

Put the shared frontend env file here:

```text
frontend/.env.local

```

This file belongs inside the `frontend/` folder.

The frontend reads at least:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api

```
=======
Do not commit local env files. The root `.gitignore` already ignores `.env` files.

### Backend

Create:

```text
backend/.env
```

The backend loads this file through `springboot4-dotenv`, so run backend commands from the `backend/` directory.

Required backend variables:

```env
PORT=3001
MONGO_URI=mongodb+srv://...
MONGO_DB=season
ALLOWED_ORIGINS=http://localhost:3000
JWT_ACCESS_SECRET=replace_with_a_long_secret
JWT_REFRESH_SECRET=replace_with_a_long_secret
```

Useful optional backend variables:

```env
JWT_ACCESS_TTL=3600
JWT_REFRESH_TTL=604800
JWT_ISSUER=season
JWT_AUDIENCE=season
ADMIN_REGISTRATION_SECRET=replace_with_a_secret
FRONTEND_PUBLIC_BASE_URL=http://localhost:3000
BACKEND_PUBLIC_BASE_URL=https://your-public-backend-url
PAYOS_WEBHOOK_PATH=/api/checkout/payos/webhook
GMAIL_USER=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
```

If you use a different backend `PORT`, update the frontend `API_URL` to match it.

### Frontend

Create:

```text
frontend/.env.local
```

Required frontend variable:

```env
API_URL=http://localhost:3001
```

`API_URL` is required by `frontend/next.config.ts`. The frontend rewrites `/api/*` requests to `${API_URL}/api/*`.

## Install Dependencies

Install frontend packages:

```bash
cd frontend
npm install
```

Maven handles backend dependencies automatically. You can compile once to verify Java dependencies:

```bash
cd backend
./mvnw -DskipTests compile
```

On Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd -DskipTests compile
```

## Run Without Docker

Use this flow when `backend/.env` has a remote `MONGO_URI`, for example MongoDB Atlas.

Terminal 1:

```bash
cd backend
./mvnw spring-boot:run
```

Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

The backend runs on the port from `backend/.env`, for example:

```text
http://localhost:3001
```

## Run With Local MongoDB In Docker

Use this only if you do not want to use remote MongoDB.

Start MongoDB from the repo root:

```bash
docker compose up -d
```

Set `backend/.env` to the local Docker MongoDB URI:

```env
MONGO_URI=mongodb://admin:mongodb123!secure@localhost:27017/myapp?authSource=admin
MONGO_DB=myapp
```

Then start backend and frontend the same way as above.

Useful Docker commands:

```bash
docker compose ps
docker compose logs mongodb
docker compose down
docker compose down -v
```

`docker compose down -v` deletes the local MongoDB volume.

## Recommended Startup Order

1. Add `backend/.env`.
2. Add `frontend/.env.local`.
3. Run `cd frontend && npm install`.
4. Start MongoDB only if `MONGO_URI` points to local Docker MongoDB.
5. Start backend from `backend/`.
6. Start frontend from `frontend/`.
7. Open `http://localhost:3000`.

## Build

Backend:

```bash
cd backend
./mvnw clean package
java -jar target/season-0.0.1-SNAPSHOT.jar
```

Frontend:

```bash
cd frontend
npm run build
npm run start
```

## Common Problems

### Frontend Fails With `API_URL is not defined`

Create `frontend/.env.local` and set:

```env
API_URL=http://localhost:3001
```

Restart `npm run dev` after changing env files.

### Backend Fails With `Please provide a MongoDB URI`

Check that `backend/.env` exists and contains `MONGO_URI`.

Run backend commands from the `backend/` folder so dotenv can load the file.

### Backend Cannot Connect To MongoDB

If using Atlas, check:

- Username and password in `MONGO_URI`
- Database name in `MONGO_DB`
- Atlas network access/IP allowlist
- Internet connection

If using local Docker MongoDB, check:

- Docker Desktop is running
- `docker compose ps` shows MongoDB running
- `MONGO_URI` uses `localhost:27017`

### CORS Errors

Make sure `ALLOWED_ORIGINS` includes the frontend URL:

```env
ALLOWED_ORIGINS=http://localhost:3000
```

### Port Conflicts

If backend port is busy, change `PORT` in `backend/.env` and update `API_URL` in `frontend/.env.local`.

## Notes

- The root `package.json` is not the main development entrypoint.
- For day-to-day work, run commands inside `frontend/` and `backend/`.
- Docker is optional unless you choose local MongoDB.
