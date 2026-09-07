import type { TareaResponse } from "../../lib/shared/validations";
import { persistKeys, safeStorage } from "../storage";
import type { AppState } from "../store";

// Genera IDs únicos para tareas offline
const generarId = () => Date.now() + Math.floor(Math.random() * 1000);

// Slice de gestión de tareas (CRUD con API + localStorage offline)
export interface TareaSlice {
	tareas: TareaResponse[];
	tareaActiva: TareaResponse | null;
	cargando: boolean;

	init: () => Promise<void>;
	createTarea: (
		nombre: string,
		categoriaId?: number,
	) => Promise<TareaResponse | null>;
	updateTarea: (id: number, data: Partial<TareaResponse>) => Promise<void>;
	deleteTarea: (id: number) => Promise<void>;
	selectTarea: (tarea: TareaResponse | null) => void;
	// Helper usado por el sync (src/lib/syncLocalToCloud.ts)
	setTareas: (tareas: TareaResponse[]) => void;
}

// Crea el slice de tareas
export const crearSliceTareas = (
	set: (
		partial: Partial<TareaSlice> | ((state: TareaSlice) => Partial<TareaSlice>),
	) => void,
	get: () => AppState,
): TareaSlice => ({
	tareas: [],
	tareaActiva: null,
	cargando: false,

	init: async () => {
		const { isLoggedIn } = get();
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
				get().addToast("Error al cargar tareas", "error");
			}
		} else {
			// 2. Si no, carga desde localStorage
			const saved = safeStorage.get<TareaResponse[]>(persistKeys.TAREAS);
			if (saved) {
				set({ tareas: saved });
			}
		}
	},

	createTarea: async (nombre, categoriaId) => {
		const limpio = typeof nombre === "string" ? nombre.trim() : "";
		if (!limpio || limpio.length > 100) return null;

		const { isLoggedIn } = get();
		// 1. Si está autenticado, crea en la API
		if (isLoggedIn) {
			try {
				const res = await fetch("/api/tareas", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ nombre: limpio, categoriaId }),
				});
				if (!res.ok) return null;
				const json = await res.json();
				const tarea = json.data as TareaResponse;
				set((state) => ({ tareas: [tarea, ...state.tareas] }));
				return tarea;
			} catch (error) {
				console.error("[TareaStore] createTarea error:", error);
				get().addToast("Error al crear tarea", "error");
				return null;
			}
		}
		// 2. Si no, crea localmente con ID generado
		const tarea: TareaResponse = {
			id: generarId(),
			nombre: limpio,
			categoriaId: categoriaId ?? null,
			estado: "pending",
			createdAt: Date.now(),
			completedAt: null,
		};

		set((state) => {
			const tareas = [tarea, ...state.tareas];
			safeStorage.set(persistKeys.TAREAS, tareas);
			return { tareas };
		});

		return tarea;
	},

	updateTarea: async (id, data) => {
		let saneado = data;
		if (data.nombre !== undefined) {
			const limpio = data.nombre.trim();
			if (!limpio || limpio.length > 100) return;
			saneado = { ...data, nombre: limpio };
		}
		const { isLoggedIn } = get();
		// 1. Si está autenticado, actualiza en la API
		if (isLoggedIn) {
			try {
				await fetch(`/api/tareas/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(saneado),
				});
			} catch (error) {
				console.error("[TareaStore] updateTarea error:", error);
			}
		}
		// 2. Actualiza en el store y persiste si es offline
		set((state) => {
			const tareas = state.tareas.map((t) =>
				t.id === id ? { ...t, ...saneado } : t,
			);
			if (!isLoggedIn) {
				safeStorage.set(persistKeys.TAREAS, tareas);
			}
			return { tareas };
		});
	},

	deleteTarea: async (id) => {
		const { isLoggedIn } = get();
		// 1. Si está autenticado, elimina en la API
		if (isLoggedIn) {
			try {
				await fetch(`/api/tareas/${id}`, { method: "DELETE" });
			} catch (error) {
				console.error("[TareaStore] deleteTarea error:", error);
				get().addToast("Error al eliminar tarea", "error");
			}
		}
		// 2. Elimina del store y persiste si es offline
		set((state) => {
			const tareas = state.tareas.filter((t) => t.id !== id);
			if (!isLoggedIn) {
				safeStorage.set(persistKeys.TAREAS, tareas);
			}
			return { tareas };
		});
	},

	selectTarea: (tarea) => {
		set({ tareaActiva: tarea });
	},

	// Reemplaza la lista de tareas (usado por el sync al subir tareas offline)
	setTareas: (tareas) => {
		set({ tareas });
	},
});
