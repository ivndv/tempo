// Tests unitarios de tareas (operaciones offline-first y sincronización con API)
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearStore, jsonOk, loguear, mockFetch } from "./helpers";

describe("tareaSlice — tareas offline-first", () => {
	let store: ReturnType<typeof crearStore>;

	beforeEach(() => {
		store = crearStore();
	});

	afterEach(() => {
		localStorage.clear();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("init offline carga tareas desde localStorage", async () => {
		const previas = [
			{
				id: 111,
				nombre: "Offline",
				categoriaId: null,
				estado: "pending",
				createdAt: 1,
				completedAt: null,
			},
		];
		localStorage.setItem("tempo_tareas", JSON.stringify(previas));
		await store.getState().initTareas();
		expect(store.getState().tareas).toEqual(previas);
	});

	it("init online carga tareas desde la API", async () => {
		loguear(store);
		mockFetch(() =>
			jsonOk([
				{
					id: 1,
					nombre: "Nube",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			]),
		);
		await store.getState().initTareas();
		expect(store.getState().tareas).toHaveLength(1);
		expect(store.getState().tareas[0].nombre).toBe("Nube");
	});

	it("createTarea offline genera id y persiste en localStorage", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
		const tarea = await store.getState().createTarea("Nueva offline");
		expect(tarea?.id).toBeGreaterThan(0);
		expect(store.getState().tareas).toHaveLength(1);
		expect(store.getState().tareas[0].nombre).toBe("Nueva offline");
		const persisted = JSON.parse(localStorage.getItem("tempo_tareas") ?? "[]");
		expect(persisted).toHaveLength(1);
	});

	it("createTarea online usa la API y no persiste en localStorage", async () => {
		loguear(store);
		const fetchFn = mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/tareas" && method === "POST")
				return jsonOk({
					id: 5,
					nombre: "Online",
					categoriaId: null,
					estado: "pending",
					createdAt: 2,
					completedAt: null,
				});
			return jsonOk(null);
		});
		const tarea = await store.getState().createTarea("Online");
		expect(tarea?.id).toBe(5);
		expect(store.getState().tareas).toHaveLength(1);
		expect(fetchFn).toHaveBeenCalledWith("/api/tareas", expect.anything());
		expect(localStorage.getItem("tempo_tareas")).toBeNull();
	});

	it("createTarea online con respuesta fallida no cambia el estado", async () => {
		loguear(store);
		mockFetch(() => new Response("nope", { status: 400 }));
		const tarea = await store.getState().createTarea("Fallará");
		expect(tarea).toBeNull();
		expect(store.getState().tareas).toHaveLength(0);
	});

	it("updateTarea offline actualiza el store y persiste", async () => {
		vi.useFakeTimers();
		const tarea = await store.getState().createTarea("Antes");
		expect(tarea).not.toBeNull();
		if (tarea === null) return;
		await store.getState().updateTarea(tarea.id, { nombre: "Después" });
		expect(store.getState().tareas[0].nombre).toBe("Después");
		const persisted = JSON.parse(localStorage.getItem("tempo_tareas") ?? "[]");
		expect(persisted[0].nombre).toBe("Después");
	});

	it("updateTarea online llama PATCH y actualiza el store", async () => {
		loguear(store);
		const fetchFn = mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/tareas/3" && method === "PATCH")
				return jsonOk({ success: true });
			return jsonOk(null);
		});
		store.setState({
			tareas: [
				{
					id: 3,
					nombre: "A",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
		});
		await store.getState().updateTarea(3, { nombre: "B" });
		expect(store.getState().tareas[0].nombre).toBe("B");
		expect(fetchFn).toHaveBeenCalledWith("/api/tareas/3", expect.anything());
	});

	it("deleteTarea offline filtra y persiste", async () => {
		vi.useFakeTimers();
		const t1 = await store.getState().createTarea("Uno");
		await store.getState().createTarea("Dos");
		expect(t1).not.toBeNull();
		if (t1 === null) return;
		await store.getState().deleteTarea(t1.id);
		expect(store.getState().tareas).toHaveLength(1);
		expect(store.getState().tareas[0].nombre).toBe("Dos");
		const persisted = JSON.parse(localStorage.getItem("tempo_tareas") ?? "[]");
		expect(persisted).toHaveLength(1);
	});

	it("deleteTarea online llama DELETE y filtra", async () => {
		loguear(store);
		const fetchFn = mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/tareas/9" && method === "DELETE")
				return jsonOk({ success: true });
			return jsonOk(null);
		});
		store.setState({
			tareas: [
				{
					id: 9,
					nombre: "A",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
		});
		await store.getState().deleteTarea(9);
		expect(store.getState().tareas).toHaveLength(0);
		expect(fetchFn).toHaveBeenCalledWith("/api/tareas/9", expect.anything());
	});

	it("selectTarea y setTareas", () => {
		store.getState().selectTarea({
			id: 1,
			nombre: "X",
			categoriaId: null,
			estado: "pending",
			createdAt: 1,
			completedAt: null,
		});
		expect(store.getState().tareaActiva?.nombre).toBe("X");
		store.getState().setTareas([]);
		expect(store.getState().tareas).toHaveLength(0);
	});

	describe("validación de nombre", () => {
		it("createTarea offline rechaza string vacío y no persiste", async () => {
			const tarea = await store.getState().createTarea("");
			expect(tarea).toBeNull();
			expect(store.getState().tareas).toHaveLength(0);
			expect(localStorage.getItem("tempo_tareas")).toBeNull();
		});

		it("createTarea offline rechaza solo espacios y no persiste", async () => {
			const tarea = await store.getState().createTarea("     ");
			expect(tarea).toBeNull();
			expect(store.getState().tareas).toHaveLength(0);
			expect(localStorage.getItem("tempo_tareas")).toBeNull();
		});

		it("createTarea offline rechaza más de 100 caracteres", async () => {
			const nombreLargo = "a".repeat(101);
			const tarea = await store.getState().createTarea(nombreLargo);
			expect(tarea).toBeNull();
			expect(store.getState().tareas).toHaveLength(0);
			expect(localStorage.getItem("tempo_tareas")).toBeNull();
		});

		it("createTarea offline aplica trim al nombre", async () => {
			const tarea = await store
				.getState()
				.createTarea("   Estudiar Algoritmos   ");
			expect(tarea).not.toBeNull();
			expect(tarea?.nombre).toBe("Estudiar Algoritmos");
			expect(store.getState().tareas[0].nombre).toBe("Estudiar Algoritmos");
			const persisted = JSON.parse(
				localStorage.getItem("tempo_tareas") ?? "[]",
			);
			expect(persisted[0].nombre).toBe("Estudiar Algoritmos");
		});

		it("createTarea online rechaza nombre vacío sin llamar a la API", async () => {
			loguear(store);
			const fetchFn = mockFetch(() => jsonOk(null));
			const tarea = await store.getState().createTarea("   ");
			expect(tarea).toBeNull();
			expect(fetchFn).not.toHaveBeenCalled();
			expect(store.getState().tareas).toHaveLength(0);
		});

		it("updateTarea rechaza nombre vacío o con puros espacios", async () => {
			const tarea = await store.getState().createTarea("Original");
			expect(tarea).not.toBeNull();
			if (!tarea) return;

			await store.getState().updateTarea(tarea.id, { nombre: "   " });
			expect(store.getState().tareas[0].nombre).toBe("Original");
		});
	});
});
