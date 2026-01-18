![Blueprint](https://capsule-render.vercel.app/api?type=waving&color=06b6d4&height=250&section=header&text=Blueprint&fontSize=90&animation=fadeIn&fontAlignY=38)

<div align="center">

**Production-Ready. Scalable. Type-Safe.** A high-performance monorepo starter kit designed for the modern web.

[![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Nest JS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TurboRepo](https://img.shields.io/badge/TurboRepo-EF5350?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://www.nginx.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

</div>

---

## ⚡ Features

### 🏗️ Core Architecture
* **TurboRepo Monorepo:** Optimized build system with caching for fast CI/CD and local development.
* **Twin-Engine Power:** Next.js 16 (App Router) frontend + NestJS backend.
* **Universal Deployment:** Pre-configured for **VPS** (Docker Compose) or **Serverless PaaS** (Vercel/Render).
* **Shared Libraries:**
    * `@repo/db`: Shared Prisma types across frontend and backend.
    * `@repo/schema`: Shared Zod schemas for end-to-end validation.
    * `@repo/ui`: Shared React components for consistent design.

### 🔐 Security & Authentication
* **Fortified Auth System:** JWT-based flow with short-lived Access Tokens (15m) and long-lived Refresh Tokens (7d).
* **"Self-Healing" Clients:** Smart Axios interceptors that automatically refresh tokens silently on 401 errors.
* **Zero-CORS Architecture:**
    * **Local/VPS:** Nginx Reverse Proxy handles traffic routing.
    * **PaaS:** Next.js Rewrites route API calls internally.
* **RBAC & Protection:** Role-Based Access Control guards for API routes and Pages.
* **OTP Verification:** Secure Email OTP flow for registration and logins.

### 🚀 Performance & Caching
* **Hybrid Rendering:** Optimized strategy combining SSR for public pages and CSR for private dashboards.
* **Redis Powered:**
    * **Auto-Caching:** `@CacheTTL` decorator for instant public route caching.
    * **Manual Caching:** Granular control for user sessions and complex queries.
    * **Rate Limiting:** Built-in DDOS protection for API endpoints.

### 🛠️ Developer Experience
* **End-to-End Type Safety:** Strict TypeScript everywhere. If the backend changes a DTO, the frontend breaks at build time.
* **Environment Validation:** Backend fails to start if required `.env` variables are missing.
* **Custom Hooks:** `useAuth` hook for managing user state, loading, and manual re-fetching.
* **Robust Linting:** Pre-configured ESLint and Prettier across the monorepo.

---

## 🏗️ Architecture Strategy

Blueprint uses a "Hybrid" fetching strategy to solve the SEO vs. Build Time dilemma.

| Page Type | Strategy | Implementation | SEO Friendly? | Docker Safe? |
| :--- | :--- | :--- | :--- | :--- |
| **Public** (`/`) | **SSR (Runtime)** | `force-dynamic` + Server API | ✅ Yes | ✅ Yes |
| **Private** (`/profile`) | **CSR (Client)** | `useEffect` + Client API | ❌ No | ✅ Yes |

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+ (Node.js 24 recommended)
* Docker & Docker Compose
* pnpm (Required for Monorepo workspaces)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/rlpratyoosh/blueprint.git
    cd blueprint
    ```

2.  **Install Dependencies**
    ```bash
    pnpm install
    ```

3.  **Environment Setup**
    Copy the example environment files for all workspaces.
    ```bash
    cp .env.example .env
    cp packages/database/.env.example packages/database/.env
    cp apps/api/.env.example apps/api/.env
    cp apps/web/.env.example apps/web/.env
    ```

4.  **Start Infrastructure (Docker)**
    Spin up PostgreSQL and Redis containers instantly.
    ```bash
    # For Development (Hot Reloading + Local DB + Nginx Proxy)
    docker-compose -f docker-compose.dev.yml up --build -d

    # For Production (Optimized builds + Nginx Proxy)
    docker-compose -f docker-compose.yml up --build -d
    ```

5.  **Run Migrations**
    ```bash
    # Apply schema to the local database
    pnpm --filter @repo/db db:migrate
    ```

6.  **Start Development Server**
    ```bash
    # Runs the entire Monorepo (Web + API)
    pnpm dev
    ```

---

## 📂 Project Structure (Important Files/Folders Only)

```bash
.
├── apps
│   ├── web             # Next.js 16 (App Router)
│   └── api             # NestJS API (with Redis & BullMQ ready)
├── packages
│   ├── database        # Shared Prisma Schema & Client
│   ├── schema          # Shared Zod Validation Schemas
│   ├── ui              # Shared React UI Components
│   └── typescript      # Shared TS Configuration
├── docker-compose.yml  # Production Orchestration (Nginx + App + DB)
└── docker-compose.dev.yml # Development Orchestration

```

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">

Made with ❤️ by [Pratyoosh](https://github.com/rlpratyoosh)

</div>