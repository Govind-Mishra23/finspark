# FinSpark (InsightX)

FinSpark is a multi-tenant feature intelligence platform for fintech product teams.

It includes:

- A React dashboard client for analytics, governance, onboarding, and AI growth insights.
- An Express + MongoDB backend for event ingestion, tenant auth, analytics, and SDK hosting.
- A standalone integration demo site to simulate client-side event tracking quickly.

## Repository Structure

- `client/` - React + Vite dashboard application
- `server/` - Node.js + Express API, MongoDB models, analytics routes, and hosted SDK
- `integration-demo/` - Static website showing SDK initialization and event tracking flow

## Tech Stack

- Frontend: React, Vite, Tailwind, Recharts
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- AI insights: Google Gemini (optional, for AI growth endpoint)

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or cloud)

## Environment Variables

Create `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/insightx
PORT=5050
GEMINI_API_KEY=your_gemini_api_key_optional
```

Notes:

- `MONGODB_URI` is required.
- `PORT` defaults to `5050` if omitted.
- `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) is only needed for `/api/analytics/ai-growth`.

## Install Dependencies

From each app folder:

```bash
cd server
npm install

cd ../client
npm install
```

## Run Locally

Start backend:

```bash
cd server
npm run dev
```

Start frontend in a second terminal:

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:3000`.

The Vite dev server proxies `/api` requests to `http://localhost:5050`.

## Seed Demo Data

To populate sample tenants and events:

```bash
cd server
npm run seed
```

## Integration Demo Site (Optional)

Use this to demonstrate third-party integration with the hosted SDK.

1. Ensure backend is running.
2. Start static server:

```bash
cd integration-demo
python3 -m http.server 5501
```

3. Open `http://localhost:5501`.
4. In the demo UI, set backend endpoint to `http://localhost:5050`, initialize SDK, and trigger events.

## Key API Surface

- Tenant APIs: `/api/tenants/*`
- Event ingestion: `/api/events`, `/api/events/batch`
- Analytics: `/api/analytics/*`
- Health check: `/api/health`
- Hosted SDK: `/sdk/insightx.js`

## Demo Login Credentials

If you run the seed script, use these accounts:

- System Admin
  - Email: `admin@insightx.com`
  - Password: `admin123`
- Demo Bank Tenant
  - Email: `admin@demobank.com`
  - Password: `demo123`

## Scripts

### Client (`client/package.json`)

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

### Server (`server/package.json`)

- `npm run dev` - start backend with file watching
- `npm start` - start backend
- `npm run seed` - seed tenants and event data

## Troubleshooting

- If frontend cannot call API endpoints, confirm backend is running on port `5050`.
- If server startup fails, check `MONGODB_URI` connectivity and credentials.
- If AI growth endpoint fails, set `GEMINI_API_KEY` or `GOOGLE_API_KEY` in `server/.env`.
