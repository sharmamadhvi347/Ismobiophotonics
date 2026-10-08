# Production Deployment Runbook

## Overview

This guide provides step-by-step instructions to deploy the Project Management System to production:

1. **Database:** Managed PostgreSQL (Render / Railway / Neon)
2. **Backend API:** NestJS REST API (Render Web Service)
3. **Web Frontend:** React + Vite Single Page Application (Vercel)
4. **Mobile Client:** React Native + Expo Android Application (`EXPO_PUBLIC_API_BASE_URL`)

---

## 1. Recommended Platforms

| Component        | Recommended Platform                | Plan           | Rationale                                                                                             |
| :--------------- | :---------------------------------- | :------------- | :---------------------------------------------------------------------------------------------------- |
| **PostgreSQL**   | **Render PostgreSQL**               | Free / Starter | Native zero-config connection to Render Web Service; automated SSL.                                   |
| **Backend API**  | **Render Web Service**              | Free / Starter | Node.js native runtime; automated health checks (`/api/health`); zero-config `render.yaml` blueprint. |
| **Web Frontend** | **Vercel**                          | Free / Hobby   | Instant global CDN distribution; zero-config Vite SPA rewrites via `vercel.json`.                     |
| **Mobile App**   | **Expo Application Services (EAS)** | Free           | Standalone Android APK build via `preview` profile in `apps/mobile/eas.json`.                         |

---

## 2. Environment Variables Specification

### A. Backend API (`apps/api`)

| Variable                 | Required | Default / Format                                            | Description                                   |
| :----------------------- | :------: | :---------------------------------------------------------- | :-------------------------------------------- |
| `NODE_ENV`               |   Yes    | `production`                                                | Environment mode                              |
| `PORT`                   |   Yes    | `10000` (Render default)                                    | HTTP port                                     |
| `DATABASE_URL`           |   Yes    | `postgresql://user:pass@host:5432/pms_prod?sslmode=require` | PostgreSQL connection string                  |
| `JWT_ACCESS_SECRET`      |   Yes    | (32+ chars random string)                                   | Secret key for JWT access tokens              |
| `JWT_REFRESH_SECRET`     |   Yes    | (32+ chars random string)                                   | Secret key for JWT refresh tokens             |
| `JWT_ACCESS_EXPIRES_IN`  |    No    | `15m`                                                       | Lifetime of access tokens                     |
| `JWT_REFRESH_EXPIRES_IN` |    No    | `7d`                                                        | Lifetime of refresh tokens                    |
| `WEB_ORIGIN`             |   Yes    | `https://your-app.vercel.app,*`                             | Allowed CORS origins (comma-separated or `*`) |

### B. Web Client (`apps/web`)

| Variable            | Required | Default / Format               | Description                         |
| :------------------ | :------: | :----------------------------- | :---------------------------------- |
| `VITE_API_BASE_URL` |   Yes    | `https://pms-api.onrender.com` | Base URL of deployed NestJS backend |

### C. Android Mobile Client (`apps/mobile`)

| Variable                   | Required | Default / Format               | Description                         |
| :------------------------- | :------: | :----------------------------- | :---------------------------------- |
| `EXPO_PUBLIC_API_BASE_URL` |   Yes    | `https://pms-api.onrender.com` | Base URL of deployed NestJS backend |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Deploy Database & Backend on Render (Automated via Blueprint)

1. Sign in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository (`Ismobiophotonics`).
4. Render will detect `render.yaml` and display the planned resources:
   - Database: `pms-postgres` (PostgreSQL)
   - Web Service: `pms-api` (Node)
5. Click **Apply**.
6. Render will:
   - Provision PostgreSQL and generate the internal `DATABASE_URL`.
   - Run `pnpm install --frozen-lockfile && pnpm build:api`.
   - Run `pnpm db:push` to automatically synchronize the Prisma schema and create all tables.
   - Start the service with `pnpm start:api`.
   - Verify health via `GET /api/health`.
7. Once deployment finishes, copy the generated service URL (e.g., `https://pms-api-xxxx.onrender.com`).

---

### Step 2: Deploy Web Application on Vercel

1. Sign in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import the `Ismobiophotonics` repository.
4. Configure Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit -> select `apps/web` (or leave `.` with build command below)
   - **Build Command:** `pnpm --filter @pms/web build`
   - **Output Directory:** `apps/web/dist` (or `dist` if root directory is `apps/web`)
   - **Install Command:** `pnpm install`
5. Add Environment Variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://pms-api-xxxx.onrender.com` (your Render API URL from Step 1)
6. Click **Deploy**.
7. Once deployed, test visiting the Vercel URL (e.g. `https://ismobiophotonics-web.vercel.app`).
8. Return to Render: In `pms-api` Environment settings, ensure `WEB_ORIGIN` includes your Vercel URL.

---

### Step 3: Configure Android Mobile Application

1. In `apps/mobile/.env`, update:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://pms-api-xxxx.onrender.com
   ```
2. Build standalone Android APK for distribution:
   ```bash
   pnpm dlx eas-cli build -p android --profile preview
   ```
3. Distribute or download the resulting `.apk` to any Android device or emulator.
