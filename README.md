# Queue Cure '26 — Full Stack npm Version

## Backend
```bash
cd backend
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`.

Test:
```bash
http://localhost:8080/api/queue/status
```

## Frontend using npm
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Vercel Environment Variable
```text
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

## Render Docker Settings
```text
Environment: Docker
Root Directory: backend
Dockerfile Path: Dockerfile
Build Command: empty
Start Command: empty
```
