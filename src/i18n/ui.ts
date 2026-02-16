
// 1. Definimos los idiomas
export const languages = {
  es: 'Español',
  en: 'English',
};

export const defaultLang = 'es';

// 2. Aquí van tus textos (Clave : Traducción)
export const ui = {
  es: {
    'nav.home': 'Inicio',
    'nav.about': 'Acerca de',
    'nav.blog': 'Blog',

    // Hero
    'hero.title': 'Domina tu tiempo',
    'hero.subtitle': 'Ya sea que estés, estudiando o creando, el método Pomodoro es tu mejor aliado.',
    'hero.span.coding': 'programando',
    'hero.span.studying': 'estudiando',
    'hero.span.creating': 'creando',
    'hero.focus.title': 'Máxima Concentración',
    'hero.focus.subtitle': 'El mundo puede esperar.',

    // Timer
    'timer.focus': 'Enfoque',
    'timer.short': 'Descanso',
    'timer.long': 'Descanso',
    'timer.setup.title': 'Configura tu Ciclo',
    'timer.setup.subtitle': 'Elige los minutos de enfoque:',
    'timer.setup.btn.start': 'Empezar a concentrarme',
    'timer.setup.btn.start.disabled': 'Selecciona un tiempo...',
    'timer.run.pause': '⏸ Pausar',
    'timer.run.resume': '▶ Continuar',
    'timer.run.new': 'Nuevo Plan ↺',
    'timer.run.cancel': 'Cancelar Plan',
    'timer.run.current': 'Bloque Actual',
    'timer.run.agenda': 'Agenda de Hoy',
    'timer.run.start': 'Inicio:',
    'timer.run.end': 'Fin Aprox:',
    'timer.run.finished': 'Terminado',

    // Timer Setup (Specific)
    'timer.setup.cycles': 'ciclos',
    'timer.setup.summary': 'Resumen del Plan',
    'timer.setup.break': 'Descanso',
    'timer.setup.finish': 'Fin',
    'stats.progress.title': 'Tu Progreso de Hoy',
    'stats.realTime': 'Tiempo de Enfoque Real',
    'stats.completedSessions': 'sesiones completadas',
    'stats.log.title': 'Log de Actividad',
    'stats.log.empty': 'Tu historial está vacío hoy. ¡A darle!',

    // Stats
    'stats.today': 'Hoy',
    'stats.focus': 'Foco',
    'stats.hours': 'Horas',
    'stats.minutes': 'Mins',
    'stats.sessions': 'Sesiones',

    // Footer
    'footer.whatis': '¿Qué es Pomodoro?',
    'footer.slogan': 'Herramienta de productividad. Sin distracciones, solo enfoque.',
    'footer.developed': 'Desarrollado por',
    'footer.rights': 'Todos los derechos reservados',

    // Auth
    'auth.login.title': 'Iniciar Sesión',
    'auth.signup.title': 'Crear Cuenta',
    'auth.login.subtitle': '¿No tienes cuenta?',
    'auth.signup.subtitle': '¿Ya tienes cuenta?',
    'auth.btn.login': 'Entrar',
    'auth.btn.signup': 'Registrarse',
    'auth.btn.toggle.login': 'Inicia Sesión',
    'auth.btn.toggle.signup': 'Regístrate',
    'auth.email.label': 'Correo Electrónico',
    'auth.email.placeholder': 'ejemplo@correo.com',
    'auth.password.label': 'Contraseña',
    'auth.password.placeholder': '••••••••',
    'auth.error.generic': 'Ocurrió un error. Inténtalo de nuevo.',
    'auth.loading': 'Cargando...',
    'auth.error.passwordWeak': 'La contraseña es muy débil. Debe tener al menos 8 caracteres, mayúsculas y números.',
    'auth.password.weak': 'Débil',
    'auth.password.medium': 'Media',
    'auth.password.strong': 'Fuerte',

    // Blog
    'blog.title': 'Sinx Blog',
    'blog.description': 'Estamos preparando el blog de Sinx Pomodoro. Muy pronto compartiremos consejos sobre productividad y enfoque.',
    'blog.comingSoon': 'Próximamente más contenido',
    'blog.body': 'Estamos preparando artículos increíbles sobre productividad, la técnica Pomodoro y cómo sacar el máximo provecho a tu tiempo de enfoque.',
    'blog.back': 'Volver al Inicio',

    // 404
    '404.title': '404 - No encontrado',
    '404.heading': '¡Te has distraído!',
    '404.description': 'Esta página no existe o se ha perdido en el tiempo. Regresa para mantener tu racha de concentración.',
    '404.back': 'Volver al Foco',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.blog': 'Blog',

    // Hero
    'hero.title': 'Master your time',
    'hero.subtitle': 'Whether you are, studying or creating, the Pomodoro method is your best ally.',
    'hero.span.coding': 'coding',
    'hero.span.studying': 'studying',
    'hero.span.creating': 'creating',
    'hero.focus.title': 'Deep Focus',
    'hero.focus.subtitle': 'The world can wait.',

    // Timer
    'timer.focus': 'Focus',
    'timer.short': 'Break',
    'timer.long': 'Break',
    'timer.setup.title': 'Setup your Cycle',
    'timer.setup.subtitle': 'How much time do you have?',
    'timer.setup.btn.start': 'Start Session',
    'timer.setup.btn.start.disabled': 'Select time...',
    'timer.run.pause': '⏸ Pause',
    'timer.run.resume': '▶ Resume',
    'timer.run.new': 'New Plan ↺',
    'timer.run.cancel': 'Cancel Plan',
    'timer.run.current': 'Current Block',
    'timer.run.agenda': "Today's Agenda",
    'timer.run.start': 'Start:',
    'timer.run.end': 'End approx:',
    'timer.run.finished': 'Finished',

    // Timer Setup (Specific)
    'timer.setup.cycles': 'cycles',
    'timer.setup.summary': 'Plan Summary',
    'timer.setup.break': 'Break',
    'timer.setup.finish': 'End',
    'stats.progress.title': "Today's Progress",
    'stats.realTime': 'Actual Focus Time',
    'stats.completedSessions': 'sessions completed',
    'stats.log.title': 'Activity Log',
    'stats.log.empty': "Your history is empty today. Let's go!",

    // Stats
    'stats.today': 'Today',
    'stats.focus': 'Focus',
    'stats.hours': 'Hours',
    'stats.minutes': 'Mins',
    'stats.sessions': 'Sessions',

    // Footer
    'footer.whatis': 'What is Pomodoro?',
    'footer.slogan': 'Productivity tool. No distractions, just focus.',
    'footer.developed': 'Developed by',
    'footer.rights': 'All rights reserved',

    // Auth
    'auth.login.title': 'Log In',
    'auth.signup.title': 'Create Account',
    'auth.login.subtitle': "Don't have an account?",
    'auth.signup.subtitle': 'Already have an account?',
    'auth.btn.login': 'Log In',
    'auth.btn.signup': 'Sign Up',
    'auth.btn.toggle.login': 'Log In',
    'auth.btn.toggle.signup': 'Sign Up',
    'auth.email.label': 'Email Address',
    'auth.email.placeholder': 'you@example.com',
    'auth.password.label': 'Password',
    'auth.password.placeholder': '••••••••',
    'auth.error.generic': 'An error occurred. Please try again.',
    'auth.loading': 'Loading...',
    'auth.error.passwordWeak': 'Password is too weak. It must have at least 8 characters, uppercase and numbers.',
    'auth.password.weak': 'Weak',
    'auth.password.medium': 'Medium',
    'auth.password.strong': 'Strong',

    // Blog
    'blog.title': 'Sinx Blog',
    'blog.description': 'We are preparing the Sinx Pomodoro blog. Very soon we will share tips on productivity and focus.',
    'blog.comingSoon': 'More content coming soon',
    'blog.body': 'We are preparing amazing articles about productivity, the Pomodoro technique, and how to get the most out of your focus time.',
    'blog.back': 'Back to Home',

    // 404
    '404.title': '404 - Not Found',
    '404.heading': 'You got distracted!',
    '404.description': "This page doesn't exist or has been lost in time. Go back to keep your focus streak.",
    '404.back': 'Back to Focus',
  },
} as const;