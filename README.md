````markdown
# Season

Season is a full-stack eyewear project with:

- a `Next.js` frontend in `frontend/`
- a `Spring Boot + MongoDB` backend in `backend/`
- a `docker-compose.yml` file at the repo root for local MongoDB

This README is the main setup guide for the project.

## Tech Stack

- Frontend: `Next.js 16`, `React 19`, `TypeScript`, `Tailwind CSS`
- Backend: `Java 17+`, `Spring Boot`, `Spring Data MongoDB`
- Database: `MongoDB` via Docker

## Prerequisites

Install these first:

- `Java JDK >= 17`
- `Node.js >= 20.9.0`
- `npm`
- `Docker`
- `Docker Compose`

Check your versions:

```bash
java -version
node -v
npm -v
docker -v
docker compose version
```
````

## Repository Structure

```text
season/
├── backend/              # Spring Boot API + MongoDB models
├── frontend/             # Next.js app
├── docker-compose.yml    # Local MongoDB
├── MONGODB_SETUP.md
└── README.md

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

### Backend

Put the shared backend configuration file here:

```text
backend/src/main/resources/application.properties

```

This file belongs inside the `backend/` folder.

The backend reads:

- `spring.data.mongodb.uri`
- `server.port` (defaults to 8080)
- `app.cors.allowed-origins` for frontend connection
- `app.jwt.access-secret` and `app.jwt.refresh-secret`
- `spring.mail.username`, `app.gmail.client-id`, `app.gmail.client-secret`, `app.gmail.refresh-token` if you are using email operations
- `app.payos.client-id` for QR checkout
- `app.payos.api-key` for QR checkout
- `app.payos.checksum-key` for QR checkout
- `app.payos.fixed-qr-amount` for the hosted PayOS QR amount
- `app.payos.frontend-url` for PayOS return and cancel URLs
- `app.payos.webhook-url` for the PayOS webhook URL

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

For the Spring Boot backend, Maven will handle dependencies automatically. You can install them by running:

```bash
cd backend
./mvnw clean install

```

_(On Windows, use `mvnw.cmd clean install`)_

### 2. Place The Shared Config Files

Put the shared configuration files in these locations:

```text
frontend/.env.local
backend/src/main/resources/application.properties

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

After MongoDB is running, ensure your database is seeded. In Spring Boot, this is typically handled automatically on startup via `CommandLineRunner` or data initialization scripts provided by your team. Check your application logs to ensure data has been loaded.

## Backend

Once the initial setup is done, run the backend from the `backend/` folder:

```bash
cd backend
./mvnw spring-boot:run

```

Default backend URL:

```text
http://localhost:8080

```

Useful backend scripts (Maven):

```bash
./mvnw spring-boot:run    # Start development server
./mvnw clean package      # Build for production

```

## PayOS QR Checkout Dev Setup

The checkout now supports both:

- `cash_on_delivery`
- `QR code` through the hosted PayOS payment page

For the current dev flow, every PayOS QR request is created with a fixed hosted amount of:

```text
10,000 VND

```

This PayOS amount is only for the QR payment request.
The internal Season order totals still use the real checkout/cart totals.

### `application.properties` example

Put values like these in `backend/src/main/resources/application.properties`:

```properties
app.payos.client-id=your_payos_client_id
app.payos.api-key=your_payos_api_key
app.payos.checksum-key=your_payos_checksum_key
app.payos.fixed-qr-amount=10000
app.payos.frontend-url=http://localhost:3000
app.payos.webhook-url=[https://your-ngrok-subdomain.ngrok-free.app/api/checkout/payos/webhook](https://your-ngrok-subdomain.ngrok-free.app/api/checkout/payos/webhook)

```

### Ngrok setup

Run the backend first:

```bash
cd backend
./mvnw spring-boot:run

```

Expose the backend with ngrok in a separate terminal:

```bash
ngrok http 8080

```

Take the public HTTPS URL from ngrok and set it in your properties:

```properties
app.payos.webhook-url=[https://your-ngrok-subdomain.ngrok-free.app/api/checkout/payos/webhook](https://your-ngrok-subdomain.ngrok-free.app/api/checkout/payos/webhook)

```

Add that exact URL in the PayOS dashboard webhook configuration.

### Local frontend return flow

For local development the frontend return page should stay:

```env
FRONTEND_PUBLIC_BASE_URL=http://localhost:3000

```

PayOS will return the shopper to the app route:

```text
/checkout/payment-result

```

That page asks the backend for the real payment state before redirecting to the success page or back to checkout.

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

1. Put the shared config files in `backend/src/main/resources/application.properties` and `frontend/.env.local`
2. Start MongoDB with Docker
3. Install frontend dependencies (`cd frontend && npm install`)
4. Start the backend (`cd backend && ./mvnw spring-boot:run`)
5. Start the frontend (`cd frontend && npm run dev`)
6. Open `http://localhost:3000`

## Build For Production

### Backend

```bash
cd backend
./mvnw clean package
java -jar target/season-0.0.1-SNAPSHOT.jar

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

### Backend fails with `Connection refused` or Mongo timeout

Your `application.properties` is missing or `spring.data.mongodb.uri` is not set correctly. Ensure Docker is running.

### Backend starts but no products appear

Check these:

1. MongoDB is running
2. Database seeding was successfully executed by Spring Boot on startup.
3. The backend is pointing at the same MongoDB database you seeded.

### Frontend loads but product API calls fail

Check these:

1. MongoDB is running
2. Backend is running on `http://localhost:8080`
3. `frontend/.env.local` points to the correct backend URL
4. `application.properties` has the correct `app.cors.allowed-origins` configured for your frontend.

## Notes

- The root `package.json` is not the main app entrypoint for day-to-day development.
- For normal work, use `frontend/` and `backend/` directly.
- The root `docker-compose.yml` is only for MongoDB.

```

```
