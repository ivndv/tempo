# AGENTS.md — Guía para Agentes en Tempo

Guía operativa y técnica para agentes de Inteligencia Artificial que colaboren en el desarrollo, mantenimiento y optimización del proyecto **Tempo**.

---

## 1. Visión General del Proyecto

**Tempo** es una aplicación web moderna diseñada para la gestión de tareas y productividad personal aplicando la técnica Pomodoro (bloques de enfoque de 25 minutos, descansos cortos y largos).

* **Propósito:** Ofrecer un temporizador interactivo con vinculación estricta a tareas, estadísticas de rendimiento en tiempo real y arquitectura de persistencia dual: modo invitado offline en `localStorage` y modo registrado persistido en SQLite en la nube vía API.
* **Dominio en Producción:** [https://tempo.mgdc.site](https://tempo.mgdc.site)
* **Repositorio:** [https://github.com/ivndv/tempo](https://github.com/ivndv/tempo)

---

## 2. Antes de Tocar Código

* **Documentación de Referencia:** Antes de realizar cambios estructurales, lee [`docs/DOCUMENTACION.md`](docs/DOCUMENTACION.md) para comprender la arquitectura de sincronización offline-first, estados y reglas de negocio.
* **Uso del MCP CodeGraph:** Antes de realizar búsquedas masivas de texto o explorar múltiples archivos a ciegas, invoca la herramienta `codegraph_explore` para inspeccionar el flujo de llamadas y el código fuente verbatim de los símbolos en una sola llamada eficiente.
* **Estado y Sincronización:**
  ```bash
  # Verificar el estado del índice
  codegraph status /home/ivan/software-dev/tempo

  # Sincronizar cambios en el árbol de archivos
  codegraph sync /home/ivan/software-dev/tempo
  ```

---

## 3. Stack Tecnológico

| Capa | Tecnología | Versión / Detalle |
| :--- | :--- | :--- |
| **Runtime & Gestor** | **Bun** | `v1.3.x` (`bun.lock`) |
| **Lenguaje** | **TypeScript** | `^7.0.2` (Modo estricto con `tsconfig.json`) |
| **Frontend & Framework** | **Astro 7** + **React 19** | `astro ^7.3.1`, `@astrojs/react ^6.0.5`, `react ^19.2.8` |
| **Estilos & UI** | **Tailwind CSS 4** + **shadcn/ui** | `@tailwindcss/vite ^4.3.3`, `shadcn ^4.21.0` |
| **Estado Global** | **Zustand 5** | `zustand ^5.0.15` (7 slices modulares combinados en `store.ts`) |
| **Backend / Edge API** | **Hono 4** en Cloudflare Pages Functions | `hono ^4.13.5`, `@hono/zod-openapi ^1.6.3` |
| **Base de Datos & ORM** | **Cloudflare D1 (SQLite)** + **Drizzle ORM** | `drizzle-orm ^0.45.2`, `drizzle-kit ^0.31.10` (8 tablas) |
| **Autenticación** | **Better Auth** | `1.6.27` (fijado por compatibilidad de esquema D1) |
| **Seguridad de Passwords** | **Hashy** (microservicio Docker/Go) | Hashing seguro con Argon2id |
| **Anti-Bot / Captcha** | **Cloudflare Turnstile** | `@marsidev/react-turnstile ^1.6.1` |
| **Sesiones & Rate Limit** | **Cloudflare Workers KV** | Persistencia de sesiones Better Auth y control de tráfico |
| **Validación** | **Zod 4** | `zod ^4.5.4` |
| **Servicio de Email** | **Resend** | `resend ^6.26.0` |
| **Linter & Formatter** | **Biome 2** | `@biomejs/biome ^2.5.12` (`biome.json`) |
| **Pruebas Unitarias** | **Vitest 5** | `vitest ^5.0.0` (96 tests de slices, sync y storage) |
| **Pruebas E2E & Smoke** | **Playwright** | `@playwright/test ^1.62.1` (45 E2E + 9 Smoke tests) |
| **Accesibilidad (A11y)** | **@axe-core/playwright** | `@axe-core/playwright ^4.13.0` (WCAG 2.1 AA) |
| **Regresión Visual** | **Playwright Visual Snapshots** | Comparación de snapshots en Chromium Linux |
| **Infraestructura & Edge** | **Cloudflare Pages, D1, KV & R2** | `wrangler ^4.129.0` |
| **CI/CD** | **GitHub Actions** | Workflows automatizados de validación y despliegue |

---

## 4. Estructura del Código

```
tempo/
├── functions/                     → Backend Edge (Cloudflare Pages Functions)
│   ├── _controllers/              → Controladores de negocio (breaks, categorias, pomodoros, tareas)
│   ├── _db/                       → Cliente y conexión a D1 (db.ts)
│   ├── _middleware/               → Middlewares de autenticación, errores y documentación
│   ├── _openapi/                  → Contratos de ruta y esquemas Zod OpenAPI
│   ├── _shared/                   → Helpers de validación y tipos comunes
│   └── api/
│       └── [[route]].ts           → Entry point Hono con OpenAPI y Better Auth
│
├── src/                           → Frontend Astro + React 19
│   ├── components/                → Componentes React y Astro modulares
│   │   ├── auth/                  → AuthButton, AuthForm, ForgotPassword, ResetPassword, SessionProvider, VerifiedHandler
│   │   ├── common/                → ErrorBoundary (guard de errores React)
│   │   ├── layout/                → Header, Footer, MobileMenu, LanguagePicker, ThemeToggle
│   │   ├── pomodoro/              → AppHome, PomodoroManager, TimerView, BreakTimer, HeroSection, TaskSelector, dialogs/
│   │   ├── stats/                 → DailySummary, WeeklySummary (gráficos y métricas)
│   │   └── ui/                    → Primitivos shadcn/ui atómicos
│   ├── db/                        → Esquemas Drizzle (schema.ts, migrations_better_auth.sql)
│   ├── hooks/                     → Custom hooks de React (useTheme, useStats, etc.)
│   ├── i18n/                      → Diccionarios y utilidades de traducción (ui.ts, utils.ts)
│   ├── layouts/                   → Layout.astro principal
│   ├── lib/                       → Lógica modular por entorno y responsabilidad
│   │   ├── client/                → auth-client.ts (Better Auth cliente)
│   │   ├── server/                → auth.ts (Better Auth backend + D1 + Hashy)
│   │   ├── shared/                → validaciones (Zod/OpenAPI), constantes y helpers
│   │   └── sync/                  → sync.ts, syncLocalToCloud.ts
│   ├── pages/                     → Rutas Astro (index, about, blog, login, forgot-password, en/)
│   └── stores/                    → Store Zustand 5 y persistencia centralizada
│       ├── storage.ts             → Persistencia segura (safeStorage, persistKeys)
│       ├── store.ts               → Store compuesto unificado
│       └── slices/                → 7 slices: tarea, pomodoro, break, user, settings, categoria, toast
│
├── tests/                         → Suites de Pruebas Automatizadas
│   ├── support/                   → Infraestructura compartida (fixtures.sql, hashy-stub, seed, helpers)
│   ├── unit/                      → Pruebas unitarias de slices, sync y storage (96 tests Vitest)
│   ├── e2e/                       → Pruebas E2E organizadas por dominio (45 tests Playwright)
│   │   ├── setup/                 → auth.setup.ts (estado de autenticación)
│   │   ├── flows/                 → 00-warmup, online, offline, idempotencia, i18n
│   │   ├── api/                   → api.spec.ts (contratos HTTP y paginación por cursor)
│   │   ├── visual/                → visual.spec.ts y snapshots Chromium Linux
│   │   ├── a11y/                  → a11y.spec.ts (WCAG 2.1 AA con Axe-core)
│   │   └── resilience/            → resiliencia.spec.ts (fallos de red y hash)
│   └── smoke/                     → Pruebas de humo críticas en entorno completo (9 tests)
│
├── public/                        → Assets estáticos públicos
├── docs/                          → Documentación técnica interna (ignorado en Git)
├── drizzle/                       → Migraciones SQL generadas por Drizzle
├── playwright.config.ts           → Configuración de pruebas E2E
├── playwright.smoke.config.ts     → Configuración de pruebas Smoke
└── wrangler.jsonc                 → Configuración de bindings D1, KV y Pages
```

---

## 5. Comandos de Desarrollo y Tooling

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

# Verificación y formato de código con Biome
bun run check
bun run lint
bun run format

# Pruebas Unitarias (Vitest - 96 tests)
bun run test:unit

# Pruebas de Humo (Playwright - 9 tests críticos)
bun run test:smoke

# Pruebas End-to-End completas (Playwright - 45 tests)
bun run test:e2e

# Operaciones de Base de Datos (D1 / Drizzle)
bun run sync:db            # Sincronizar esquema/datos remotos a local
bun run db:gen             # Generar migraciones con drizzle-kit
bun run db:check           # Verificar integridad del esquema Drizzle
```

---

## 6. Convenciones Obligatorias para Agentes

### 6.1 Regla de Oro en Ejecución de Tests
* **NO ejecutar comandos de test de forma reactiva tras cada pequeño cambio.** Realizar todos los cambios de código primero y acumularlos; correr las suites de pruebas únicamente al final cuando todo el conjunto esté listo y verificado.

### 6.2 Reglas Críticas de Negocio
* **Traducción obligatoria de IDs locales:** Jamás enviar IDs generados localmente (`Date.now() + random`) a endpoints de la API (`/api/*`) sin pasar previamente por `traducirTareaId` (`src/lib/sync/sync.ts:37`).
* **Vinculación estricta de Pomodoro:** Prohibido iniciar un pomodoro sin un `tareaId` válido asignado.
* **Compatibilidad de Better Auth:** Mantener la versión de `better-auth` en `1.6.27` para preservar la compatibilidad con el esquema actual de SQLite en Cloudflare D1.

### 6.3 Estilo de Código y Comentarios
* **Lenguaje:** Todo el código, comentarios y documentación deben redactarse en **español**.
* **Comentarios de 1 sola línea:** Concisos, directos y explicativos del *por qué*, sin bloques redundantes ni tecnicismos innecesarios.
* **Tipado estricto:** Prohibido el uso de `any`; definir interfaces explícitas para props, estados y modelos de datos.

### 6.4 Accesibilidad Web (WCAG 2.1 AA)
* Todo elemento interactivo debe poseer etiquetas accesibles (`aria-label`, `aria-describedby` o texto visible/oculto para lectores de pantalla).
* Mantener un contraste de color superior a **4.5:1** en ambos temas (claro y oscuro).

### 6.5 Flujo de Git y Despliegues
* **PROHIBIDO realizar commits o push sin la aprobación explícita del usuario.**
* **Flujo de ramas:** Todo desarrollo se realiza en la rama `develop` y se mergea hacia `main` mediante fast-forward una vez validado.
* **Mensajes de commit:** Seguir *Conventional Commits* en minúsculas y español (`feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`).
* **Documentación:** El directorio `docs/` se mantiene estrictamente en `.gitignore`; la documentación técnica local no se sube al repositorio Git.