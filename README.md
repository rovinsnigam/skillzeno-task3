# Offerflow

Offerflow is a private job and internship application tracker. It gives each person one place to save opportunities, track progress from Saved through Offer, and keep notes and job links close at hand.

## Features

- Email/password registration and sign-in with hashed passwords and signed session tokens
- User-scoped create, read, update, and delete operations for applications
- Search by company, role, or location and filter by status
- Dashboard pipeline, active application count, response rate, and seven-day activity
- Responsive layout for desktop and mobile
- SQLite persistence; the API also serves the built frontend in production

## Run locally

Requires Node.js 22.5 or newer (for the built-in SQLite module).

```sh
npm install
copy .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The API runs on port 3001 and SQLite creates `server/data/offerflow.sqlite` automatically. Set a long random `JWT_SECRET` in `.env` before sharing a deployment. For production, run `npm run build` followed by `npm start`; set `PORT`, `JWT_SECRET`, and a persistent `DATABASE_PATH` in the hosting environment.

## REST API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Health check |
| `POST` | `/api/auth/register` | Public | Create an account |
| `POST` | `/api/auth/login` | Public | Sign in |
| `GET` | `/api/auth/me` | Bearer token | Get the current account |
| `GET` | `/api/applications` | Bearer token | List the current user's applications |
| `POST` | `/api/applications` | Bearer token | Add an application |
| `PUT` | `/api/applications/:id` | Bearer token | Update an owned application |
| `DELETE` | `/api/applications/:id` | Bearer token | Delete an owned application |

## Project report

**Problem:** Job seekers often track roles across browser tabs, email, and notes, making follow-ups and progress difficult to see.

**Solution:** Offerflow provides a single, account-specific workspace for the application pipeline, with a quick overview and searchable records.

**Implementation:** React and Vite power the responsive client. Express exposes a REST API, SQLite stores accounts and applications, bcrypt hashes passwords, and JWT bearer tokens protect user-specific routes. Every application read and mutation is scoped to the authenticated account.

**Verification:** Run `npm run build` for the frontend production build. Start the full app with `npm run dev`, register an account, then add, edit, filter, and delete an application to exercise the CRUD flow.

**Deployment status:** This source project is ready to deploy, but has not been published to a hosting provider or GitHub from this workspace. Add production secrets and persistent SQLite storage on a host before deployment; publish the repository after connecting an authenticated GitHub account.