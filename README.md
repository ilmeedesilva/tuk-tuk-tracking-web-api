# Tuk-Tuk Tracking API

**Student ID:** COBSCCOMP24.2P-029

Real-Time Three-Wheeler (Tuk-Tuk) Tracking & Movement Logging System for Sri Lanka Law Enforcement.

A RESTful API built with **Node.js 20 / ES Modules**, **Express.js**, **Prisma ORM**, deployed serverlessly on **AWS Lambda + API Gateway** with **PostgreSQL** (Supabase).

---

## API Documentation (Swagger)

- **Production:** `https://97vfspxi93.execute-api.ap-south-1.amazonaws.com/prod/api/docs/`
- **Local:** `http://localhost:3000/api/docs`

---

## Architecture

```
Client (Postman / curl / police browser)
         │
         ▼
  AWS API Gateway  ──── Rate limiting, request routing
         │
         ▼
  AWS Lambda (Node.js 20)  ──── Express app via serverless-http
         │
         ▼
  Supabase PostgreSQL (pgBouncer)  ──── Connection pooling
         │
         ▼
  AWS CloudWatch  ──── Centralised logging & monitoring
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 LTS (ES Modules) |
| Framework | Express.js 4 |
| ORM | Prisma 5 + PostgreSQL |
| Auth | JWT (access 15m + refresh 7d), bcrypt |
| Deployment | AWS Lambda + API Gateway (Serverless Framework) |
| Database | Supabase PostgreSQL (with pgBouncer) |
| Logging | Winston + CloudWatch |
| Docs | Swagger / OpenAPI 3.0 |

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL (or Supabase account)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd tuk-tuk-tracking-api
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npm run db:migrate:dev

# 5. Seed the database (9 provinces, 25 districts, 200 vehicles)
npm run db:seed

# 6. Generate location history (8 days × 200 vehicles)
npm run simulate

# 7. Start dev server
npm run dev
```

### API is now running at `http://localhost:3000`

---

## Testing the API

```bash
# Health check
curl http://localhost:3000/health

# Login (get JWT)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hq.admin","password":"Admin@1234"}'

# List all vehicles (with Bearer token)
curl http://localhost:3000/api/v1/vehicles \
  -H "Authorization: Bearer <access-token>"

# Live tracking dashboard
curl http://localhost:3000/api/v1/live-tracking \
  -H "Authorization: Bearer <access-token>"

# Submit location ping (as a device)
# First login as a device user: device.sn-tt-00001 / Device@5678
curl -X POST http://localhost:3000/api/v1/location-pings \
  -H "Authorization: Bearer <device-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 6.9271,
    "longitude": 79.8612,
    "speed": 25.5,
    "heading": 180,
    "timestamp": "2026-03-27T10:30:00Z"
  }'
```

---

## Default Credentials (after seeding)

| Role | Username | Password |
|------|----------|----------|
| HQ Administrator | `hq.admin` | `Admin@1234` |
| Provincial Admin (WP) | `wp.admin` | `Admin@1234` |
| District Officer (CMB) | `cmb.officer` | `Admin@1234` |
| Station Officer | `cmb.fort.sgt` | `Admin@1234` |
| GPS Device (example) | `device.sn-tt-00001` | `Device@5678` |

---

## Git Branching Strategy

```
main  ─── Production branch (auto-deploys to AWS via GitHub Actions)
  │
  └── dev  ─── Development branch (auto-deploys to dev AWS stage)
```

**Rules:**
- Never commit directly to `main`
- All features via pull requests into `dev/ilmee`
- `dev/ilmee` → `main` via PR after testing

---

## AWS Deployment

### First-time Setup

```bash
# Install Serverless Framework globally
npm install -g serverless

# Configure AWS credentials
aws configure

# Deploy to dev
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

### GitHub Actions (Automated)

Set these secrets in GitHub repository settings:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DEV_DATABASE_URL`, `DEV_DIRECT_URL`, `DEV_JWT_SECRET`, `DEV_JWT_REFRESH_SECRET`
- `PROD_DATABASE_URL`, `PROD_DIRECT_URL`, `PROD_JWT_SECRET`, `PROD_JWT_REFRESH_SECRET`
- `PROD_API_URL` (for post-deploy health check)

Push to `dev/ilmee` → deploys to dev Lambda.
Push to `main` → deploys to production Lambda.

---

## RBAC — Role-Based Access Control

| Role | Scope | Key Permissions |
|------|-------|----------------|
| `HQ_ADMIN` | Nationwide | Full CRUD on all resources |
| `PROVINCIAL_ADMIN` | Own province | Manage stations, users, vehicles in province |
| `DISTRICT_OFFICER` | Own district | Manage vehicles; assign devices |
| `STATION_OFFICER` | Own district (read) | View vehicles and location data |
| `DEVICE` | Own vehicle only | Submit location pings |

---

## API Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Current user profile |
| GET/POST | `/api/v1/provinces` | List/Create provinces |
| GET/PUT/DELETE | `/api/v1/provinces/:id` | Get/Update/Delete province |
| GET/POST | `/api/v1/districts` | List/Create districts |
| GET/PUT/DELETE | `/api/v1/districts/:id` | Get/Update/Delete district |
| GET/POST | `/api/v1/police-stations` | List/Create stations |
| GET/PUT/DELETE | `/api/v1/police-stations/:id` | Get/Update/Delete station |
| GET/POST | `/api/v1/users` | List/Create users |
| GET/PUT/DELETE | `/api/v1/users/:id` | Get/Update/Delete user |
| PATCH | `/api/v1/users/:id/activate` | Activate user |
| PATCH | `/api/v1/users/:id/deactivate` | Deactivate user |
| GET/POST | `/api/v1/devices` | List/Register devices |
| GET/PUT | `/api/v1/devices/:id` | Get/Update device |
| PATCH | `/api/v1/devices/:id/assign` | Assign device to vehicle |
| PATCH | `/api/v1/devices/:id/unassign` | Unassign device |
| PATCH | `/api/v1/devices/:id/decommission` | Decommission device |
| GET/POST | `/api/v1/vehicles` | List/Register vehicles |
| GET/PUT/DELETE | `/api/v1/vehicles/:id` | Get/Update/Delete vehicle |
| PATCH | `/api/v1/vehicles/:id/status` | Change vehicle status |
| POST | `/api/v1/location-pings` | Submit GPS ping (device only) |
| GET | `/api/v1/location-pings` | Query pings (time-window, district, province) |
| GET | `/api/v1/location-pings/:vehicleId/history` | Vehicle movement history |
| GET | `/api/v1/live-tracking` | Live view — all vehicles |
| GET | `/api/v1/live-tracking/summary` | Dashboard summary stats |
| GET | `/api/v1/live-tracking/:vehicleId` | Single vehicle live position |
| GET | `/health` | API health check |

---

## Scalability

The architecture handles 10,000+ requests/second via:
- **AWS Lambda** auto-scales horizontally with zero configuration
- **API Gateway** handles load balancing and SSL termination
- **Supabase pgBouncer** connection pooler prevents DB connection exhaustion
- **`last_known_locations` table** materialises the live view for O(1) reads (no JOIN)
- **Composite indexes** on `(vehicleId, timestamp)` for fast history queries
- **Lambda reserved concurrency** (50) protects DB from connection storms

---

*NB6007CEM Web API Development — NIBM / Coventry University*


