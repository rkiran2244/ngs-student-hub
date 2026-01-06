# StudentHub

## Project info

StudentHub is a Vite + React application used to manage student uploads and admin workflows.

## How can I edit this code?

You can edit the project using your preferred IDE (VS Code, WebStorm, etc.).

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading.
npm run dev
```

### Editing locally
- Open the project in your IDE and modify files under `src/`.
- Build for production with `npm run build`.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

There are two recommended deployment approaches:

1) Docker / Compose (recommended for full-stack deployments)

- Start the app locally with Docker Compose:

  1. Copy env example files and update secrets:
     ```sh
     cp backend/.env.example backend/.env
     cp frontend/.env.example frontend/.env
     ```
  2. Build and run services:
     ```sh
     docker-compose -f docker-compose.prod.yml up --build -d
     ```
  3. Frontend will be available at http://localhost (port 80) and backend at http://localhost:5001.

2) Platform-specific (Railway, Render, Heroku)

- Backend: use `backend/Dockerfile` or deploy with Gunicorn using `Procfile` (Heroku). Ensure `DATABASE_URL`, `JWT_SECRET_KEY`, and `UPLOAD_FOLDER` are provided as env vars.
- Frontend: build the static `dist/` (Vite) and serve with a static host or via `frontend/Dockerfile` (nginx) for container deployments.

### CI & automation
- `.github/workflows/ci.yml` builds the frontend and runs backend tests.
- `.github/workflows/publish.yml` is a template to build & push Docker images to GHCR (configure secrets before enabling).

---

## Responsive updates ✅

Short note: I applied mobile-first responsive improvements that preserve the existing desktop UI but improve layouts on small screens. Changes include stacked form fields on mobile, responsive grid breakpoints, full-width action buttons on small screens, and table wrappers for horizontal scrolling.

Files updated (frontend): `src/pages/auth/SignupPage.tsx`, `src/pages/student/ProfilePage.tsx`, `src/pages/student/FeedbackPage.tsx`, `src/pages/admin/FeedbacksPage.tsx`, `src/pages/admin/StudentsPage.tsx`.
