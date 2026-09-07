import type { CategoriaResponse } from "../../lib/shared/validations";
import type { AppState } from "../store";

// Slice de gestión de categorías (CRUD contra API)
export interface CategoriaSlice {
	categorias: CategoriaResponse[];
	cargando: boolean;

	initCategorias: () => Promise<void>;
	createCategoria: (nombre: string) => Promise<CategoriaResponse | null>;
	updateCategoria: (
		id: number,
		data: Partial<CategoriaResponse>,
	) => Promise<void>;
	deleteCategoria: (id: number) => Promise<void>;
}

// Crea el slice de categorías
export const crearSliceCategorias = (
	set: (
		partial:
			| Partial<CategoriaSlice>
			| ((state: CategoriaSlice) => Partial<CategoriaSlice>),
	) => void,
	get: () => AppState,
): CategoriaSlice => ({
	categorias: [],
	cargando: false,

	initCategorias: async () => {
		const { isLoggedIn } = get();
		if (!isLoggedIn) return;

		// 1. Carga categorías desde la API
		set({ cargando: true });
		try {
			const catRes = await fetch("/api/categorias");
			if (catRes.ok) {
				const json = await catRes.json();
				let cats: CategoriaResponse[] = json.data;
				// 2. Si no hay categorías, crea las tres por defecto
				if (cats.length === 0) {
					const seedRes = await fetch("/api/categorias/seed", {
						method: "POST",
					});
					if (seedRes.ok) {
						const seedJson = await seedRes.json();
						cats = seedJson.data;
					}
				}
				set({ categorias: cats });
			}
		} catch (error) {
			console.error("[CategoriaStore] init error:", error);
			get().addToast("Error al cargar categorías", "error");
		} finally {
			set({ cargando: false });
		}
	},

	createCategoria: async (nombre) => {
		const { isLoggedIn } = get();
		if (!isLoggedIn) return null;

		// 1. Crea la categoría en la API
		try {
			const res = await fetch("/api/categorias", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ nombre }),
			});
			if (!res.ok) return null;
			const json = await res.json();
			const cat = json.data as CategoriaResponse;
			// 2. Agrega al store
			set((state) => ({ categorias: [...state.categorias, cat] }));
			return cat;
		} catch (error) {
			console.error("[CategoriaStore] create error:", error);
			get().addToast("Error al crear categoría", "error");
			return null;
		}
	},

	updateCategoria: async (id, data) => {
		const { isLoggedIn } = get();
		if (!isLoggedIn) return;

		// 1. Actualiza en la API
		try {
			await fetch(`/api/categorias/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
		} catch (error) {
			console.error("[CategoriaStore] update error:", error);
			get().addToast("Error al actualizar categoría", "error");
		}
		// 2. Actualiza en el store
		set((state) => ({
			categorias: state.categorias.map((c) =>
				c.id === id ? { ...c, ...data } : c,
			),
		}));
	},

	deleteCategoria: async (id) => {
		const { isLoggedIn } = get();
		if (!isLoggedIn) return;

		// 1. Elimina en la API
		try {
			await fetch(`/api/categorias/${id}`, { method: "DELETE" });
		} catch (error) {
			console.error("[CategoriaStore] delete error:", error);
			get().addToast("Error al eliminar categoría", "error");
		}
		// 2. Elimina del store
		set((state) => ({
			categorias: state.categorias.filter((c) => c.id !== id),
		}));
	},
});
