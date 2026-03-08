# AWS Personal Site

## Tech Stack

- Frontend: React 18, React Router, webpack 5, Less
- Backend: Node.js, Express, SQLite

## Local Development

### 1) Start backend (`3000`)

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2) Start frontend (`8080`)

```bash
cd frontend
npm install
npm run dev
```

### 3) Open in browser

- Home: `http://localhost:8080`
- Resume: `http://localhost:8080/resume`

Notes:
- Frontend dev server proxies `/api` to `http://localhost:3000`
- You can call backend APIs from frontend directly in local development
