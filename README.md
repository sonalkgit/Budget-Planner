# Smart Budget & Transaction Engine

Production-ready full-stack application: **React** frontend and **Node.js (NestJS)** backend, with JWT auth, budgets, transactions, and category overspend validation.

## Stack

- **Frontend:** React (Vite), React Router, React Hook Form, Recharts
- **Backend:** Node.js, NestJS, TypeORM, PostgreSQL
- **Auth:** JWT (access token), bcrypt password hashing, rate limiting on login
- **Testing:** Jest (backend), Vitest (frontend), TDD-oriented
- **CI/CD:** GitHub Actions (install, test, coverage)

## Repository layout

```
Assignment/
├── backend/          # NestJS API
├── frontend/         # React (Vite) SPA
├── .github/workflows/ci.yml
├── REQUIREMENTS_CHECKLIST.md
└── README.md
```

## Database choice: PostgreSQL

- **ACID** and **decimal precision** for money.
- **Constraints and relations** (user → budgets → transactions).
- **JSONB** for `categoryLimits` per budget.

## AI usage disclosure

- **Where AI was used:** Boilerplate structure, test skeletons, CI workflow, README layout.
- **How AI assisted:** Generating consistent patterns, suggesting validation rules.
- **Manually validated:** Business logic, security, env and deployment steps.
- **Decisions made independently:** PostgreSQL as DB, React + Vite, separate frontend/backend.
