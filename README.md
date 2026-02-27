# ContentRepurpose

Upload your episode once. Get a week's worth of content back — posts, threads, quotes, newsletter drafts — in your voice, ready to publish.

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- S3-compatible storage (MinIO for self-hosting)

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your API keys (OPENAI_API_KEY, etc.)

# Start infrastructure (Postgres, Redis, MinIO)
docker compose up postgres redis minio -d

# Run database migrations
npx prisma migrate deploy

# Start the dev server
npm run dev

# Start the worker (separate terminal)
npm run worker
```

Open [http://localhost:3000](http://localhost:3000).

## Production — Docker Compose

The full stack runs as five containers: web, worker, postgres, redis, minio.

```bash
# Create your .env from the example
cp .env.example .env
# Set real values for OPENAI_API_KEY, AUTH_SECRET, STRIPE keys, etc.
# DATABASE_URL, REDIS_URL, and S3_ENDPOINT are overridden by docker-compose.yml

# Build and start everything
docker compose up -d --build

# Run database migrations against the containerized Postgres
docker compose exec web npx prisma migrate deploy

# Create the S3 bucket in MinIO
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/contentrepurpose
```

Services:

| Service  | Port | Description              |
|----------|------|--------------------------|
| web      | 3000 | Next.js app              |
| worker   | —    | BullMQ episode processor |
| postgres | 5432 | PostgreSQL database      |
| redis    | 6379 | Redis for job queue      |
| minio    | 9000 | S3-compatible storage    |
| minio    | 9001 | MinIO console            |

## Production — PM2 (VPS)

For running on an existing VPS with Postgres and Redis already available:

```bash
# Build the app
npm run build

# Start with PM2
npx pm2 start ecosystem.config.js

# Useful PM2 commands
npx pm2 status          # Check process status
npx pm2 logs            # Tail all logs
npx pm2 logs crp-worker # Tail worker logs only
npx pm2 restart all     # Restart everything
npx pm2 stop all        # Stop everything
```

Logs are written to `./logs/`. PM2 auto-restarts crashed processes (up to 10 times with a 3s delay).

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string (use password in production: `redis://:password@host:6379`)
- `OPENAI_API_KEY` — For Whisper transcription and GPT-4o content generation
- `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` — File storage
- `AUTH_SECRET` — NextAuth session encryption key
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Billing

## Scripts

| Script           | Description                    |
|------------------|--------------------------------|
| `npm run dev`    | Start Next.js dev server       |
| `npm run build`  | Build for production           |
| `npm run start`  | Start production Next.js       |
| `npm run worker` | Start BullMQ worker            |
| `npm run lint`   | Run ESLint                     |
