# Tempo 

## Descripción

Aplicación web moderna diseñada para ayudarte a gestionar tu tiempo de estudio o trabajo utilizando la técnica Pomodoro. El objetivo es maximizar tu productividad dividiendo el tiempo en bloques de enfoque total seguidos de breves descansos, todo dentro de una interfaz limpia y rápida.

## Características

- **Técnica Pomodoro basada en tareas**: Vincula cada bloque de enfoque de 25 minutos a una tarea específica para medir tu rendimiento real.
- **Pausa y reanudación flexible**: Si interrumpes una sesión, tu tiempo restante queda guardado para retomarlo cuando estés listo.
- **Estadísticas y progreso**: Consulta métricas diarias y semanales con gráficos de actividad y promedios de tiempo enfocado.
- **Modo offline y sincronización**: Úsala al instante sin registrarte o inicia sesión para sincronizar tus tareas y sesiones en la nube.
- **Modo oscuro y claro**: Interfaz adaptable a tus preferencias visuales con transiciones fluidas.
- **Soporte multi-idioma**: Interfaz completamente disponible en español e inglés.

## Secciones

1. **Selector de Tareas**: Crea, organiza por categorías (Trabajo, Estudio, Personal) y selecciona tareas antes de arrancar tus sesiones.
2. **Temporizador Pomodoro**: Cuenta regresiva interactiva con indicador visual de avance y pausas/descansos automáticos (cortos y largos).
3. **Estadísticas y Rendimiento**: Resumen diario y gráficos semanales para monitorear tu avance y horas de enfoque.
4. **Autenticación**: Registro e inicio de sesión seguro, verificación por correo y recuperación de contraseña olvidada.
5. **Acerca de**: Guía explicativa sobre los principios, reglas y beneficios de la técnica Pomodoro.
6. **Blog**: Artículos de divulgación y consejos prácticos para optimizar tu productividad y concentración.

## Uso

- **Acceder a la Aplicación**: Entra directamente desde cualquier navegador aquí: [Tempo](https://tempo.mgdc.site/).
- **Modo Libre o Cuenta Personal**: Usa el temporizador al instante sin registrarte, o crea tu cuenta para sincronizar tus tareas e historial en la nube.
- **Recuperar Contraseña**: Si pierdes tu acceso, solicita un enlace de restablecimiento desde la pantalla de inicio de sesión para recibirlo en tu correo.
- **Configurar y Concentrarte**: Elige o crea una tarea, presiona iniciar y deja que la app organice tus bloques de enfoque y descansos.
- **Explorar Recursos**: Aprende las bases de la metodología en la sección *Acerca de* o lee guías de productividad en el *Blog*.
- **Alternar Idioma y Tema**: Cambia entre español e inglés y alterna entre modo claro y oscuro con un solo clic desde la barra superior.

## Tecnologías Utilizadas

- **Frontend**: Astro 7, React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Cloudflare Pages Functions (Hono 4), Cloudflare D1 (SQLite via Drizzle ORM), Workers KV
- **Autenticación**: Better Auth, Cloudflare Turnstile
- **Estado**: Zustand 5
- **Validación**: Zod 4
- **Internacionalización**: Paraglide JS 2.0
- **Testing**: Vitest, Playwright
- **Herramientas**: Bun, Biome, TypeScript
- **Infra & CI/CD**: Cloudflare Pages, GitHub Actions

## Instalación

1. **Clonar el Repositorio**: Descarga el código de este proyecto en tu máquina usando Git.

```bash
git clone https://github.com/ivndv/tempo.git
```

2. **Instalar Dependencias**: Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
bun install
```

3. **Variables de Entorno**: Crea un archivo `.env` o `.dev.vars` en la raíz con las siguientes variables:

```env
BETTER_AUTH_URL=http://localhost:4321
BETTER_AUTH_SECRET=tu_secreto_aqui
PUBLIC_TURNSTILE_SITE_KEY=tu_site_key
TURNSTILE_SECRET_KEY=tu_secret_key
HASH_SERVICE_URL=http://localhost:3010
HASH_SERVICE_API_KEY=tu_api_key
```

4. **Iniciar el Proyecto**:

```bash
# Solo frontend (sin API):
bun run dev

# Full stack con API (Cloudflare Functions):
bun run dev:full
```

## Despliegue

La aplicación está construida para ser sumamente ligera y se encuentra desplegada de forma global a través de Cloudflare Pages. Puedes usarla directamente aquí: [tempo.mgdc.site](https://tempo.mgdc.site/)

## Licencia

Licencia de Uso Personal:

Este software es propiedad de **Ivan Cruz**. Se permite el uso de este software solo para fines personales y no comerciales. No se permite la distribución, modificación ni uso comercial de este software sin el consentimiento expreso de **Ivan Cruz**.

Cualquier uso no autorizado puede resultar en acciones legales.
