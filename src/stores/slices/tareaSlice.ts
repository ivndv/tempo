import type { TareaResponse } from "../../lib/validations";

// Clave para persistir tareas en localStorage (offline)
const TAREAS_KEY = "tempo_tareas";

// Genera IDs únicos para tareas offline
const generarId = () => Date.now() + Math.floor(Math.random() * 1000);

// Slice de gestión de tareas (CRUD con API + localStorage offline)
export interface TareaSlice {
	tareas: TareaResponse[];
	tareaActiva: TareaResponse | null;
	cargando: boolean;

	init: (isLoggedIn: boolean) => Promise<void>;
	createTarea: (
		nombre: string,
		isLoggedIn: boolean,
		categoriaId?: number,
	) => Promise<TareaResponse | null>;
	updateTarea: (
		id: number,
		data: Partial<TareaResponse>,
		isLoggedIn: boolean,
	) => Promise<void>;
	deleteTarea: (id: number, isLoggedIn: boolean) => Promise<void>;
	selectTarea: (tarea: TareaResponse | null) => void;
}

// Crea el slice de tareas
export const crearSliceTareas = (
	set: (
		partial: Partial<TareaSlice> | ((state: TareaSlice) => Partial<TareaSlice>),
	) => void,
	_get: () => TareaSlice,
): TareaSlice => ({
	tareas: [],
	tareaActiva: null,
	cargando: false,

	init: async (isLoggedIn) => {
		// 1. Si está autenticado, carga desde la API
		if (isLoggedIn) {
			try {
				const res = await fetch("/api/tareas");
				if (res.ok) {
					const json = await res.json();
					set({ tareas: json.data });
				}
			} catch (error) {
				console.error("[TareaStore] init tareas error:", error);
				// biome-ignore lint/suspicious/noExplicitAny: acceso cross-slice a addToast
				(_get() as any).addToast?.("Error al cargar tareas", "error");
			}
		} else {
			// 2. Si no, carga desde localStorage
			try {
				const saved = localStorage.getItem(TAREAS_KEY);
				if (saved) {
					set({ tareas: JSON.parse(saved) });
				}
			} catch {
				localStorage.removeItem(TAREAS_KEY);
			}
		}
	},

	createTarea: async (nombre, isLoggedIn, categoriaId) => {
		// 1. Si está autenticado, crea en la API
		if (isLoggedIn) {
			try {
				const res = await fetch("/api/tareas", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ nombre, categoriaId }),
				});
				if (!res.ok) return null;
				const json = await res.json();
				const tarea = json.data as TareaResponse;
				set((state) => ({ tareas: [tarea, ...state.tareas] }));
				return tarea;
			} catch (error) {
				console.error("[TareaStore] createTarea error:", error);
				// biome-ignore lint/suspicious/noExplicitAny: acceso cross-slice a addToast
				(_get() as any).addToast?.("Error al crear tarea", "error");
				return null;
			}
		}
		// 2. Si no, crea localmente con ID generado
		const tarea: TareaResponse = {
			id: generarId(),
			nombre,
			categoriaId: categoriaId ?? null,
			estado: "pending",
			createdAt: Date.now(),
			completedAt: null,
		};

		set((state) => {
			const tareas = [tarea, ...state.tareas];
			localStorage.setItem(TAREAS_KEY, JSON.stringify(tareas));
			return { tareas };
		});

		return tarea;
	},

	updateTarea: async (id, data, isLoggedIn) => {
		// 1. Si está autenticado, actualiza en la API
		if (isLoggedIn) {
			try {
				await fetch(`/api/tareas/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
			} catch (error) {
				console.error("[TareaStore] updateTarea error:", error);
			}
		}
		// 2. Actualiza en el store y persiste si es offline
		set((state) => {
			const tareas = state.tareas.map((t) =>
				t.id === id ? { ...t, ...data } : t,
			);
			if (!isLoggedIn) {
				localStorage.setItem(TAREAS_KEY, JSON.stringify(tareas));
			}
			return { tareas };
		});
	},

	deleteTarea: async (id, isLoggedIn) => {
		// 1. Si está autenticado, elimina en la API
		if (isLoggedIn) {
			try {
				await fetch(`/api/tareas/${id}`, { method: "DELETE" });
			} catch (error) {
				console.error("[TareaStore] deleteTarea error:", error);
				// biome-ignore lint/suspicious/noExplicitAny: acceso cross-slice a addToast
				(_get() as any).addToast?.("Error al eliminar tarea", "error");
			}
		}
		// 2. Elimina del store y persiste si es offline
		set((state) => {
			const tareas = state.tareas.filter((t) => t.id !== id);
			if (!isLoggedIn) {
				localStorage.setItem(TAREAS_KEY, JSON.stringify(tareas));
			}
			return { tareas };
		});
	},

	selectTarea: (tarea) => {
		set({ tareaActiva: tarea });
	},
});
