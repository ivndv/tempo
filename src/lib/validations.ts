import { z } from "zod";

export const crearTareaSchema = z.object({
	nombre: z.string().min(1, "El nombre es requerido").max(100),
	categoriaId: z.number().int().positive().optional(),
});

export const actualizarTareaSchema = z.object({
	nombre: z.string().min(1).max(100).optional(),
	categoriaId: z.number().int().positive().optional(),
	estado: z.enum(["pending", "in_progress", "done", "abandoned"]).optional(),
});

export const crearPomodoroSchema = z.object({
	tareaId: z.number().int().positive("Debe seleccionar una tarea"),
	status: z.enum(["active", "completed", "completed_early", "interrupted"]),
	minutesActual: z.number().int().min(0).max(25).optional(),
});

export const crearBreakSchema = z.object({
	tipo: z.enum(["short", "long"]),
	status: z.enum(["active", "completed", "skipped", "interrupted"]),
	minutesActual: z.number().int().min(0).optional(),
});
