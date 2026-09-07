// Pruebas de contrato HTTP directo contra la API (sin navegador)
import { type APIRequestContext, expect, test } from "@playwright/test";

const SIN_SESION: Parameters<typeof test.use>[0] = {
	storageState: { cookies: [], origins: [] },
};

// Helper: crea tarea de prueba vía API y devuelve su ID
const crearTareaApi = async (request: APIRequestContext) => {
	const res = await request.post("/api/tareas", {
		data: { nombre: `API ${Date.now()}` },
	});
	expect(res.status()).toBe(201);
	const body = await res.json();
	return body.data.id as number;
};

test.describe("api — contrato HTTP (sin navegador)", () => {
	test.describe("sin sesión", () => {
		test.use(SIN_SESION);

		test("las rutas responden 401", async ({ request }) => {
			const lista = await request.get("/api/tareas");
			expect(lista.status()).toBe(401);
			const crear = await request.post("/api/tareas", {
				data: { nombre: "X" },
			});
			expect(crear.status()).toBe(401);
		});
	});

	test("GET /api/tareas devuelve la lista con el shape esperado", async ({
		request,
	}) => {
		const res = await request.get("/api/tareas");
		expect(res.ok()).toBeTruthy();
		const body = await res.json();
		expect(Array.isArray(body.data)).toBe(true);
		for (const t of body.data as Array<Record<string, unknown>>) {
			expect(typeof t.id).toBe("number");
			expect(typeof t.nombre).toBe("string");
			expect(["pending", "active", "done"]).toContain(t.estado);
			expect(typeof t.createdAt).toBe("number");
		}
	});

	test("GET /api/tareas?estado=pending solo trae pendientes", async ({
		request,
	}) => {
		const id = await crearTareaApi(request);
		try {
			const res = await request.get("/api/tareas?estado=pending");
			const body = await res.json();
			const creada = (body.data as Array<{ id: number; estado: string }>).find(
				(t) => t.id === id,
			);
			if (!creada) throw new Error("se esperaba la tarea creada");
			expect(creada.estado).toBe("pending");
		} finally {
			await request.delete(`/api/tareas/${id}`);
		}
	});

	test("POST /api/tareas crea y responde 201 con el shape completo", async ({
		request,
	}) => {
		const nombre = `API crear ${Date.now()}`;
		const res = await request.post("/api/tareas", {
			data: { nombre },
		});
		expect(res.status()).toBe(201);
		const body = await res.json();
		expect(body.data).toMatchObject({
			nombre,
			estado: "pending",
			completedAt: null,
		});
		expect(typeof body.data.id).toBe("number");
		await request.delete(`/api/tareas/${body.data.id}`);
	});

	test("POST /api/tareas sin nombre responde 400", async ({ request }) => {
		const res = await request.post("/api/tareas", {
			data: {},
		});
		expect(res.status()).toBe(400);
	});

	test("PATCH /api/tareas/:id actualiza y con estado done setea completedAt", async ({
		request,
	}) => {
		const id = await crearTareaApi(request);
		try {
			const renombrar = await request.patch(`/api/tareas/${id}`, {
				data: { nombre: "API renombrada" },
			});
			expect(renombrar.status()).toBe(200);
			expect((await renombrar.json()).success).toBe(true);

			const done = await request.patch(`/api/tareas/${id}`, {
				data: { estado: "done" },
			});
			expect(done.status()).toBe(200);

			const detalle = await (await request.get(`/api/tareas/${id}`)).json();
			expect(detalle.data.nombre).toBe("API renombrada");
			expect(detalle.data.estado).toBe("done");
			expect(detalle.data.completedAt).not.toBeNull();
		} finally {
			await request.delete(`/api/tareas/${id}`);
		}
	});

	test("PATCH /api/tareas/:id sin campos responde 400", async ({ request }) => {
		const id = await crearTareaApi(request);
		try {
			const res = await request.patch(`/api/tareas/${id}`, {
				data: {},
			});
			expect(res.status()).toBe(400);
		} finally {
			await request.delete(`/api/tareas/${id}`);
		}
	});

	test("GET /api/tareas/:id devuelve detalle con pomodoros y stats vacíos", async ({
		request,
	}) => {
		const id = await crearTareaApi(request);
		try {
			const res = await request.get(`/api/tareas/${id}`);
			expect(res.ok()).toBeTruthy();
			const body = await res.json();
			expect(body.data.id).toBe(id);
			expect(body.data.pomodoros).toEqual([]);
			expect(body.data.stats).toEqual({ total: 0, totalTime: 0 });
		} finally {
			await request.delete(`/api/tareas/${id}`);
		}
	});

	test("GET /api/tareas/:id inexistente responde 404", async ({ request }) => {
		const res = await request.get("/api/tareas/999999999");
		expect(res.status()).toBe(404);
	});

	test("DELETE /api/tareas/:id elimina y el GET posterior responde 404", async ({
		request,
	}) => {
		const id = await crearTareaApi(request);
		const res = await request.delete(`/api/tareas/${id}`);
		expect(res.status()).toBe(200);
		expect((await res.json()).success).toBe(true);
		const posterior = await request.get(`/api/tareas/${id}`);
		expect(posterior.status()).toBe(404);
	});

	test("POST /api/pomodoros registra y stats lo cuenta", async ({
		request,
	}) => {
		const id = await crearTareaApi(request);
		try {
			const res = await request.post("/api/pomodoros", {
				data: { tareaId: id, status: "completed", minutesActual: 25 },
			});
			expect(res.status()).toBe(201);
			const body = await res.json();
			expect(body.data).toMatchObject({
				tareaId: id,
				status: "completed",
				minutesPlanned: 25,
				minutesActual: 25,
			});

			const stats = await (await request.get("/api/pomodoros/stats")).json();
			expect(stats.data.total).toBeGreaterThanOrEqual(1);
			expect(stats.data.totalTime).toBeGreaterThanOrEqual(25);
		} finally {
			await request.delete(`/api/tareas/${id}`);
		}
	});

	test("POST /api/breaks calcula los minutos planificados por tipo", async ({
		request,
	}) => {
		const corto = await (
			await request.post("/api/breaks", {
				data: { tipo: "short", status: "completed", minutesActual: 5 },
			})
		).json();
		expect(corto.data.minutesPlanned).toBe(5);

		const largo = await (
			await request.post("/api/breaks", {
				data: { tipo: "long", status: "completed", minutesActual: 15 },
			})
		).json();
		expect(largo.data.minutesPlanned).toBe(15);

		const lista = await (await request.get("/api/breaks")).json();
		expect(Array.isArray(lista.data)).toBe(true);
		expect(lista.data.length).toBeGreaterThanOrEqual(2);
	});
});
