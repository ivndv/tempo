# AGENTS.md — Tempo

## 1. Visión general

**Tempo** es una aplicación web de gestión de tareas y productividad personal basada en la técnica Pomodoro (bloques de enfoque de 25 minutos, descansos cortos y largos).

- **Propósito:** temporizador interactivo con vinculación estricta a tareas, estadísticas de rendimiento en tiempo real y persistencia dual: modo invitado offline en `localStorage` y modo registrado persistido en SQLite en la nube vía API.
- **Dominio en producción:** [https://tempo.mgdc.site](https://tempo.mgdc.site)
- **Repositorio:** [https://github.com/ivndv/tempo](https://github.com/ivndv/tempo)

## 2. Antes de tocar código

- Antes de cambios estructurales, lee [`docs/DOCUMENTACION.md`](docs/DOCUMENTACION.md): arquitectura de sincronización offline-first, estados y reglas de negocio.

**CodeGraph** (índice de símbolos del repo): usa `codegraph_explore` (`query`, `maxFiles`, `projectPath`) antes de un grep masivo o de leer varios archivos; devuelve fuente verbatim, rutas de llamada e impacto.

- `codegraph sync /home/ivan/software-dev/tempo` tras editar, pull o cambiar de rama (incremental, uso normal).
- `codegraph index /home/ivan/software-dev/tempo` solo al crear el índice, tras `codegraph upgrade` o si `status` avisa `built by vX` (rebuild completo).
- `codegraph status /home/ivan/software-dev/tempo` para comprobar el estado.

## 3. Stack tecnológico

| Capa | Tecnología | Versión / Detalle |
| :--- | :--- | :--- |
| **Runtime & Gestor** | **Bun** | `v1.3.x` (`bun.lock`) |
| **Lenguaje** | **TypeScript** | `^7.0.2` (modo estricto con `tsconfig.json`) |
| **Frontend & Framework** | **Astro 7** + **React 19** | `astro ^7.3.1`, `@astrojs/react ^6.0.5`, `react ^19.2.8` |
| **Estilos & UI** | **Tailwind CSS 4** + **shadcn/ui** | `@tailwindcss/vite ^4.3.3`, `shadcn ^4.21.0` |
| **Estado Global** | **Zustand 5** | `zustand ^5.0.15` (7 slices modulares combinados en `store.ts`) |
| **Backend / Edge API** | **Hono 4** en Cloudflare Pages Functions | `hono ^4.13.5`, `@hono/zod-openapi ^1.6.3` |
| **Base de Datos & ORM** | **Cloudflare D1 (SQLite)** + **Drizzle ORM** | `drizzle-orm ^0.45.2`, `drizzle-kit ^0.31.10` (9 tablas) |
| **Autenticación** | **Better Auth** | `1.6.27` |
| **Seguridad de Passwords** | **Hashy** (microservicio Docker/Go) | Hashing seguro con Argon2id |
| **Anti-Bot / Captcha** | **Cloudflare Turnstile** | `@marsidev/react-turnstile ^1.6.1` |
| **Sesiones & Rate Limit** | **KV (sesiones) + D1 (rate limit)** | Sesiones Better Auth en KV; rate limiting en D1 (tabla `rate_limit`) |
| **Validación** | **Zod 4** | `zod ^4.5.4` |
| **Servicio de Email** | **Resend** | `resend ^6.26.0` |
| **Internacionalización (i18n)** | **Paraglide JS 2.0** | `@inlang/paraglide-js ^2.1.1` (compilación a funciones TS puras, mensajes en `messages/`) |
| **Linter & Formatter** | **Biome 2** | `@biomejs/biome ^2.5.12` (`biome.json`) |
| **Pruebas Unitarias** | **Vitest 5** | `vitest ^5.0.0` (106 tests de slices, sync, storage y rate limit) |
| **Pruebas E2E & Smoke** | **Playwright** | `@playwright/test ^1.62.1` (51 E2E + 12 Smoke tests) |
| **Accesibilidad (A11y)** | **@axe-core/playwright** | `@axe-core/playwright ^4.13.0` (WCAG 2.1 AA) |
| **Regresión Visual** | **Playwright Visual Snapshots** | Comparación de snapshots en Chromium Linux |
| **Infraestructura & Edge** | **Cloudflare Pages, D1, KV & R2** | `wrangler ^4.129.0` |

## 4. Estructura del código

```text
tempo/
├── functions/                     → Backend Edge (Cloudflare Pages Functions)
│   ├── _controllers/              → Controladores de negocio (breaks, categorias, health, pomodoros, tareas)
│   ├── _db/                       → Cliente y conexión a D1 (db.ts)
│   ├── _middleware/               → Middlewares de autenticación, errores, rate limiting y documentación
│   ├── _openapi/                  → Contratos de ruta y esquemas Zod OpenAPI
│   ├── _shared/                   → Helpers de validación, tipos comunes y rate limiting (rate-limit/)
│   └── api/
│       └── [[route]].ts           → Entry point Hono con OpenAPI y Better Auth
│
├── messages/                      → Diccionarios JSON de internacionalización (es.json, en.json)
│
├── src/                           → Frontend Astro + React 19
│   ├── components/                → Componentes React y Astro modulares
│   │   ├── about/                 → AboutEs, AboutEn (contenido editorial localizado)
│   │   ├── auth/                  → AuthButton, AuthForm, ForgotPassword, ResetPassword, SessionProvider, VerifiedHandler
│   │   ├── common/                → ErrorBoundary (guard de errores React)
│   │   ├── layout/                → Header, Footer, MobileMenu, LanguagePicker, ThemeToggle
│   │   ├── pomodoro/              → AppHome, PomodoroManager, TimerView, BreakTimer, HeroSection, TaskSelector, dialogs/
│   │   ├── stats/                 → DailySummary, WeeklySummary (gráficos y métricas)
│   │   └── ui/                    → Primitivos shadcn/ui atómicos
│   ├── db/                        → Esquemas Drizzle (schema.ts, migrations_better_auth.sql)
│   ├── hooks/                     → Custom hooks de React (useTheme, useStats, etc.)
│   ├── layouts/                   → Layout.astro principal
│   ├── lib/                       → Lógica modular por entorno y responsabilidad
│   │   ├── client/                → auth-client.ts (Better Auth cliente)
│   │   ├── server/                → auth.ts (Better Auth backend + D1 + Hashy)
│   │   ├── shared/                → validaciones (Zod/OpenAPI), constantes y helpers
│   │   └── sync/                  → sync.ts, syncLocalToCloud.ts
│   ├── pages/                     → Rutas Astro dinámicas [...locale] (index, login, forgot-password, reset-password, about, blog, 404)
│   ├── paraglide/                 → Runtime y funciones generadas por Paraglide JS (messages.js, runtime.js)
│   └── stores/                    → Store Zustand 5 y persistencia centralizada
│       ├── storage.ts             → Persistencia segura (safeStorage, persistKeys)
│       ├── store.ts               → Store compuesto unificado
│       └── slices/                → 7 slices: tarea, pomodoro, break, user, settings, categoria, toast
│
├── tests/                         → Suites de Pruebas Automatizadas
│   ├── support/                   → Infraestructura compartida (fixtures.sql, hashy-stub, seed, helpers)
│   ├── unit/                      → Pruebas unitarias de slices, sync, storage y rate limit (106 tests Vitest)
│   ├── e2e/                       → Pruebas E2E organizadas por dominio (51 tests Playwright)
│   │   ├── setup/                 → auth.setup.ts (estado de autenticación)
│   │   ├── flows/                 → 00-warmup, online, offline, idempotencia, i18n
│   │   ├── api/                   → api.spec.ts (contratos HTTP y paginación por cursor)
│   │   ├── visual/                → visual.spec.ts y snapshots Chromium Linux
│   │   ├── a11y/                  → a11y.spec.ts (WCAG 2.1 AA con Axe-core)
│   │   └── resilience/            → resiliencia.spec.ts (fallos de red y hash)
│   └── smoke/                     → Pruebas de humo críticas en entorno completo (12 tests)
│
├── public/                        → Assets estáticos públicos
├── docs/                          → Documentación técnica interna
├── drizzle/                       → Migraciones SQL generadas por Drizzle
├── playwright.config.ts           → Configuración de pruebas E2E
├── playwright.smoke.config.ts     → Configuración de pruebas Smoke
└── wrangler.json                  → Configuración de bindings D1, KV y Pages
```

## 5. Arquitectura y flujo de datos

- **Frontend:** Astro 7 + React 19; estado global en Zustand 5 con 7 slices combinados en `src/stores/store.ts` y persistencia centralizada en `src/stores/storage.ts`.
- **Backend:** Hono 4 en Cloudflare Pages Functions, con contratos OpenAPI y Better Auth en `functions/api/[[route]].ts`.
- **Persistencia dual:** invitado en `localStorage`; registrado en D1 (SQLite) a través de la API.
- **Sincronización:** `src/lib/sync/sync.ts` y `syncLocalToCloud.ts` reconcilian el estado local con la nube.
- **Sesiones y límites:** sesiones de Better Auth en KV; rate limiting en D1 (tabla `rate_limit`).
- **Passwords:** hashing con Hashy (microservicio Docker/Go, Argon2id).
- **i18n:** Paraglide JS compila los mensajes de `messages/` a funciones TypeScript puras.

## 6. Comandos

Todos los comandos se ejecutan con **Bun**:

```bash
# Desarrollo Frontend (Astro dev en puerto 4321)
bun run dev

# Desarrollo Fullstack (Build + Wrangler Pages Functions con D1 y KV locales)
bun run dev:full

# Compilación de producción
bun run build

# Previsualización del build estático
bun run preview

# Verificación de código con Biome
bun run check

# Lint con Biome
bun run lint

# Formato con Biome
bun run format

# Pruebas Unitarias (Vitest - 106 tests)
bun run test:unit

# Pruebas de Humo (Playwright - 12 tests críticos)
bun run test:smoke

# Pruebas End-to-End completas (Playwright - 51 tests)
bun run test:e2e

# Operaciones de Base de Datos (D1 / Drizzle)
bun run sync:db            # Sincronizar esquema/datos remotos a local
bun run db:gen             # Generar migraciones con drizzle-kit
bun run db:check           # Verificar integridad del esquema Drizzle
```

## 7. Convenciones y reglas críticas

### 7.1 Regla de oro en ejecución de tests

- **NO ejecutar comandos de test de forma reactiva tras cada pequeño cambio.** Realizar todos los cambios de código primero y acumularlos; correr las suites de pruebas únicamente al final, cuando todo el conjunto esté listo y verificado.

### 7.2 Reglas críticas de negocio

- **Traducción obligatoria de IDs locales:** jamás enviar IDs generados localmente (`Date.now() + random`) a endpoints de la API (`/api/*`) sin pasar previamente por `traducirTareaId` (`src/lib/sync/sync.ts:37`).
- **Vinculación estricta de Pomodoro:** prohibido iniciar un pomodoro sin un `tareaId` válido asignado.
- **Compatibilidad de Better Auth:** mantener la versión de `better-auth` en `1.6.27` para preservar la compatibilidad con el esquema actual de SQLite en Cloudflare D1.

### 7.3 Estilo de código y comentarios

- **Lenguaje:** todo el código, comentarios y documentación deben redactarse en **español**.
- **Comentarios de una sola línea:** concisos, directos y explicativos del *por qué*, sin bloques redundantes ni tecnicismos innecesarios.
- **Tipado estricto:** prohibido el uso de `any`; definir interfaces explícitas para props, estados y modelos de datos.

### 7.4 Accesibilidad web (WCAG 2.1 AA)

- Todo elemento interactivo debe poseer etiquetas accesibles (`aria-label`, `aria-describedby` o texto visible/oculto para lectores de pantalla).
- Mantener un contraste de color superior a **4.5:1** en ambos temas (claro y oscuro).

## 8. Flujo de Git y despliegue

- **PROHIBIDO realizar commits o push sin la aprobación explícita del usuario.**
- **Flujo de ramas:** todo desarrollo se realiza en la rama `develop`; el merge a `main` se hace mediante fast-forward solo con aprobación explícita y tras validar.
- **Mensajes de commit:** seguir *Conventional Commits* en minúsculas y español (`feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`). **Estrictamente una sola línea de título sin cuerpo, saltos de línea ni viñetas adicionales.**
- **Documentación:** el directorio `docs/` se mantiene estrictamente en `.gitignore`; la documentación técnica local no se sube al repositorio Git.

## 9. CI/CD

- **GitHub Actions:** workflows automatizados de validación y despliegue.
