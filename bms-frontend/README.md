# BMS Frontend - Starter

Minimal Vite + React + TypeScript starter for the Building Management System.

Quick start:

```bash
cd bms-frontend
npm install
# set VITE_API_BASE_URL in .env or .env.local if needed
npm run dev
```

What this scaffold includes:
- Axios instance with `VITE_API_BASE_URL` and Authorization header
- Basic `login` helper storing JWT in `localStorage`
- `PermissionGate` utility (reads permissions from JWT)
- `ProtectedRoute` for route protection
- `Login` and `Dashboard` example pages

Next steps I can do for you:
- Add Tailwind + components
- Implement Tenants/Leases pages scaffolds
- Wire real backend endpoints and error handling
