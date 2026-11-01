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


## Despliegue

La aplicación está construida para ser sumamente ligera y se encuentra desplegada de forma global a través de Cloudflare Pages. Puedes usarla directamente aquí: [Tempo](https://tempo.mgdc.site/)

## Licencia

[MIT](LICENSE) © 2026 Ivan Cruz
