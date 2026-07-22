<p align="center">
  <a href="https://treinux.vercel.app/">
    <img src="public/brand/treinux-logo-dark.svg" alt="Treinux" width="360" />
  </a>
</p>

<p align="center">
  <em>Build your workout plans, log every set, and watch each session print itself — a training diary that reads like a zine and runs like an instrument.</em>
</p>

<p align="center">
  <strong>Live at <a href="https://treinux.vercel.app/">treinux.vercel.app</a></strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="Better Auth" src="https://img.shields.io/badge/Better%20Auth-1-000?logo=auth0&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
</p>

---

## 📖 About

**Treinux** is a web **workout diary** (in pt-BR) built around two things people actually do: **planning** what to train, and **doing** the training. You assemble *fichas* (workout plans) from a catalog of **1,324 exercises**, generate splits automatically, then start a live session that tracks your rest and logs every set — and when you finish, the session is **"printed"** back into your history as a summary sheet.

The whole product runs on a **hybrid design system** with two visual languages:

- **Zine / risograph** (paper) — every planning screen: plans, catalog, generator, history. Copy-shop print energy: paper grain, ink overprint, rubber stamps, hard offset shadows, barbell-plate data-viz.
- **Telemetry** (charcoal) — *only* the live workout: a dark instrument panel with a giant **seven-segment rest timer**, per-set **LEDs**, and monospaced data you glance at between sets.

> One line: *a zine you read between sessions, and an instrument you glance at during them.*

---

## ✨ Features

| Screen                        | What it does                                                                                                                                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Suas fichas**         | Lists your workout plans as paste-up cards (hard shadows, tape, ghost numerals), a live**data ticker** (weekly sets, last workout, next in rotation), and archived plans.                                                   |
| **Ficha (detail)**      | The plan as a zine cover: prescription per exercise (sets × reps · weight · rest), inline**prescription editor**, reorder / swap-for-another (same muscle) / remove, and the boundary CTA **"● Iniciar treino"**. |
| **Catálogo**           | 1,324 exercises with free-text search + two filter dimensions (muscle group, equipment), pt-BR names, photos, and an add-to-ficha panel with a sets stepper.                                                                      |
| **Exercício (detail)** | Encyclopedia page: photo/animation, target + secondary muscles, numbered execution steps, and a ficha picker to add it to a plan.                                                                                                 |
| **Gerar ficha**         | Automatic generator (a "print-shop order"): modality (weights / calisthenics), muscle groups, equipment, per-workout duration → a**live proof** of the resulting split before anything is saved.                           |
| **Treino (live)**       | Telemetry takeover: seven-segment rest countdown that lights up per set, real per-set**weight/reps** logging, session clock, and finish / discard.                                                                          |
| **Treino (history)**    | Each session "off the press" as a printed sheet — mono readout table under a**CONCLUÍDO** stamp — plus the session archive with totals (avg rest, volume, duration).                                                     |

Other product details: **email/password auth** (Better Auth, httpOnly cookie sessions), fully **pt-BR** content with exercise names translated, `prefers-reduced-motion` respected throughout, and a **mobile-first** responsive layout.

---

## 🏗️ Tech stack

| Layer                    | Technology                                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**      | **Next.js 16** (App Router, Turbopack, React Server Components, Server Actions) · **React 19**                                                               |
| **Auth**           | **Better Auth** (email/password, httpOnly cookie session) via the Prisma adapter; a `requireSession()` guard scopes every page and action to the owner            |
| **Database / ORM** | **PostgreSQL** (Neon) · **Prisma 6** (`directUrl` for migrations, pooled connection at runtime)                                                            |
| **Styling**        | **Tailwind CSS 4** (`@theme` tokens) · custom design system with two token sets (zine paper + telemetry charcoal); glyphs as icons, zero icon library            |
| **Language**       | **TypeScript** end to end                                                                                                                                           |
| **Data**           | [ExerciseDB](https://exercisedb.dev/) dataset — **1,324 exercises**, all with pt-BR names (`namePt`), photos + animations (© [Gym Visual](https://gymvisual.com)) |
| **Deploy**         | **Vercel** (web) · **Neon** (Postgres)                                                                                                                       |

---

## 🌐 Extra technical details

- **Hybrid design system** — two visual languages sharing one DNA (Space Grotesk, tabular numerals, zero border-radius, wordmark + accent dot). The dark "instrument" is scoped to the live workout only; everything else is the printed zine. Its own vocabulary: paper grain (`feTurbulence`), ink **overprint** misregistration on the one big title per screen, spinning `textPath` **stamps**, adhesive tape, and a **barbell-plate** data-viz (1 plate = 4 sets).
- **Deterministic ficha generator** — pure, testable rules in `src/lib/generator.ts`: weights uses a gym-equipment allowlist; calisthenics splits by push / pull / legs / core; target duration maps to exercise count via the same time model as the plan stats; groups are distributed across fichas round-robin with a live preview.
- **Live workout timing** — the rest timer is client-side; each logged set stores a `completedAt`, so the printed summary can compute the **average rest** from the gaps between consecutive sets.
- **Media pipeline** — the original ExerciseDB GIFs (~126 MB) are converted to WebP via `scripts/gif-to-webp.mjs` (ffmpeg); the app serves the optimized `public/exercicios-anim/*.webp`.
- **pt-BR everywhere** — exercise names, prescriptions (`22,5 kg`), dates and copy all localized; the catalog prefers `namePt ?? name`.

---

## 🚀 Running locally

**Prerequisites:** Node ≥ 20 and a Postgres database (local or [Neon](https://neon.tech/)).

```bash
# 1. Install dependencies
npm install

# 2. Set up .env (see below)

# 3. Database: generate the client, apply migrations, seed the catalog
npm run db:generate
npm run db:migrate
npm run db:seed        # imports the ExerciseDB catalog (resumable)

# 4. Start the dev server
npm run dev            # Next.js → http://localhost:3000
```


### 📜 Scripts

| Script                        | What it does                   |
| ----------------------------- | ------------------------------ |
| `npm run dev`               | Next.js dev server (Turbopack) |
| `npm run build` / `start` | Production build / serve       |
| `npm run lint`              | ESLint                         |
| `npm run db:generate`       | Prisma Client                  |
| `npm run db:migrate`        | Apply migrations (dev)         |
| `npm run db:studio`         | Prisma Studio                  |
| `npm run db:seed`           | Seed the exercise catalog      |
| `npm run assets:webp`       | Convert exercise GIFs → WebP  |

---

## ☁️ Deploy

| Component          | Platform         | Notes                                                                                                |
| ------------------ | ---------------- | ---------------------------------------------------------------------------------------------------- |
| **Web**      | **Vercel** | Live at [treinux.vercel.app](https://treinux.vercel.app/); Next.js preset auto-detected; set the`.env` vars in the project. |
| **Database** | **Neon**   | Managed Postgres;`DIRECT_URL` for `prisma migrate deploy`, `DATABASE_URL` (pooled) at runtime. |

---

<p align="center"><sub>Made with ☕ by ArturCx</sub></p>
