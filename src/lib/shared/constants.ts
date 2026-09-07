// Estados posibles de una tarea
export const ESTADOS_TAREA = [
	"pending",
	"in_progress",
	"done",
	"abandoned",
] as const;

// Estados de una sesión de pomodoro
export const ESTADOS_POMODORO = [
	"active",
	"completed",
	"completed_early",
	"interrupted",
] as const;

// Tipos de descanso
export const TIPOS_BREAK = ["short", "long"] as const;

// Estados de un descanso
export const ESTADOS_BREAK = [
	"active",
	"completed",
	"skipped",
	"interrupted",
] as const;

// Tipos inferidos desde los arrays de constantes
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];
export type EstadoPomodoro = (typeof ESTADOS_POMODORO)[number];
export type BreakTipo = (typeof TIPOS_BREAK)[number];
export type EstadoBreak = (typeof ESTADOS_BREAK)[number];
