import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { auth } from "../../src/lib/auth";
import {
	crearTareaSchema,
	actualizarTareaSchema,
	crearPomodoroSchema,
	crearBreakSchema,
} from "../../src/lib/validations";

type Bindings = {
	DB: D1Database;
	LUCIA_KV: KVNamespace;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	TURNSTILE_SECRET_KEY: string;
	HASH_SERVICE_URL: string;
	HASH_SERVICE_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

const checkRateLimit = async (
	kv: KVNamespace,
	ip: string,
	maxAttempts = 20,
	windowMinutes = 5,
) => {
	const key = `rate-limit:login:${ip}`;
	const now = Date.now();
	const data = await kv.get<{ attempts: number; resetAt: number }>(key, "json");

	if (!data || now > data.resetAt) {
		await kv.put(
			key,
			JSON.stringify({ attempts: 1, resetAt: now + windowMinutes * 60 * 1000 }),
			{ expirationTtl: windowMinutes * 60 },
		);
		return true;
	}

	if (data.attempts >= maxAttempts) return false;

	await kv.put(
		key,
		JSON.stringify({ attempts: data.attempts + 1, resetAt: data.resetAt }),
		{ expirationTtl: Math.ceil((data.resetAt - now) / 1000) },
	);
	return true;
};

const getSession = async (c: {
	env: Bindings;
	req: { raw: { headers: Headers } };
}) => {
	return await auth(c.env.DB, c.env.LUCIA_KV, c.env).api.getSession({
		headers: c.req.raw.headers,
	});
};

// ─── CATEGORÍAS ─────────────────────────────────────────────

app.get("/categorias", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const { results } = await c.env.DB.prepare(
		"SELECT id, nombre FROM categoria WHERE user_id = ? ORDER BY id",
	)
		.bind(session.user.id)
		.all();

	return c.json({ data: results });
});

app.post("/categorias/seed", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const defaults = [
		{ nombre: "Trabajo", userId: session.user.id },
		{ nombre: "Estudio", userId: session.user.id },
		{ nombre: "Personal", userId: session.user.id },
	];

	await c.env.DB.prepare(
		"INSERT INTO categoria (nombre, user_id) VALUES (?, ?), (?, ?), (?, ?)",
	)
		.bind(
			defaults[0].nombre, defaults[0].userId,
			defaults[1].nombre, defaults[1].userId,
			defaults[2].nombre, defaults[2].userId,
		)
		.run();

	return c.json({ data: defaults });
});

// ─── TAREAS ─────────────────────────────────────────────────

app.get("/tareas", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const estado = c.req.query("estado");

	let query = "SELECT id, nombre, categoria_id as categoriaId, estado, created_at as createdAt, completed_at as completedAt FROM tarea WHERE user_id = ?";
	const params: (string | number)[] = [session.user.id];

	if (estado) {
		query += " AND estado = ?";
		params.push(estado);
	}

	query += " ORDER BY created_at DESC";

	const { results } = await c.env.DB.prepare(query).bind(...params).all();

	return c.json({ data: results });
});

app.get("/tareas/:id", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number.parseInt(c.req.param("id"), 10);

	const tarea = await c.env.DB.prepare(
		"SELECT id, nombre, categoria_id as categoriaId, estado, created_at as createdAt, completed_at as completedAt FROM tarea WHERE id = ? AND user_id = ?",
	)
		.bind(id, session.user.id)
		.first();

	if (!tarea) return c.json({ error: "Tarea no encontrada" }, 404);

	const pomodoros = await c.env.DB.prepare(
		"SELECT id, status, minutes_planned as minutesPlanned, minutes_actual as minutesActual, created_at as createdAt FROM pomodoro WHERE tarea_id = ? ORDER BY created_at",
	)
		.bind(id)
		.all();

	const stats = await c.env.DB.prepare(
		"SELECT COUNT(*) as total, COALESCE(SUM(minutes_actual), 0) as totalTime FROM pomodoro WHERE tarea_id = ? AND status IN ('completed', 'completed_early')",
	)
		.bind(id)
		.first();

	return c.json({ data: { ...tarea, pomodoros: pomodoros.results, stats } });
});

app.post("/tareas", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json();
	const parsed = crearTareaSchema.safeParse(body);
	if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

	const { nombre, categoriaId } = parsed.data;

	const result = await c.env.DB.prepare(
		"INSERT INTO tarea (nombre, categoria_id, user_id, created_at) VALUES (?, ?, ?, ?)",
	)
		.bind(nombre, categoriaId || null, session.user.id, Date.now())
		.run();

	return c.json({ data: { id: result.meta.last_row_id, nombre, categoriaId, estado: "pending" } }, 201);
});

app.patch("/tareas/:id", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number.parseInt(c.req.param("id"), 10);
	const body = await c.req.json();
	const parsed = actualizarTareaSchema.safeParse(body);
	if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

	const sets: string[] = [];
	const params: (string | number | null)[] = [];

	if (parsed.data.nombre !== undefined) {
		sets.push("nombre = ?");
		params.push(parsed.data.nombre);
	}
	if (parsed.data.categoriaId !== undefined) {
		sets.push("categoria_id = ?");
		params.push(parsed.data.categoriaId);
	}
	if (parsed.data.estado !== undefined) {
		sets.push("estado = ?");
		params.push(parsed.data.estado);
		if (parsed.data.estado === "done") {
			sets.push("completed_at = ?");
			params.push(Date.now());
		}
	}

	if (sets.length === 0) return c.json({ error: "Sin campos para actualizar" }, 400);

	params.push(id, session.user.id);

	await c.env.DB.prepare(
		`UPDATE tarea SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
	)
		.bind(...params)
		.run();

	return c.json({ success: true });
});

app.delete("/tareas/:id", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number.parseInt(c.req.param("id"), 10);

	await c.env.DB.prepare("DELETE FROM pomodoro WHERE tarea_id = ?").bind(id).run();
	await c.env.DB.prepare("DELETE FROM tarea WHERE id = ? AND user_id = ?").bind(id, session.user.id).run();

	return c.json({ success: true });
});

// ─── POMODOROS ──────────────────────────────────────────────

app.post("/pomodoros", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json();
	const parsed = crearPomodoroSchema.safeParse(body);
	if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

	const { tareaId, status, minutesActual } = parsed.data;

	const result = await c.env.DB.prepare(
		"INSERT INTO pomodoro (tarea_id, status, minutes_planned, minutes_actual, created_at) VALUES (?, ?, 25, ?, ?)",
	)
		.bind(tareaId, status, minutesActual || null, Date.now())
		.run();

	return c.json({ data: { id: result.meta.last_row_id, tareaId, status, minutesActual } }, 201);
});

app.get("/pomodoros", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const fecha = c.req.query("fecha") || new Date().toISOString().split("T")[0];
	const inicioDelDia = new Date(fecha).getTime();
	const finDelDia = inicioDelDia + 86400000;

	const { results } = await c.env.DB.prepare(
		"SELECT p.id, p.tarea_id as tareaId, p.status, p.minutes_planned as minutesPlanned, p.minutes_actual as minutesActual, p.created_at as createdAt, t.nombre as tareaNombre FROM pomodoro p JOIN tarea t ON t.id = p.tarea_id WHERE t.user_id = ? AND p.created_at >= ? AND p.created_at < ? ORDER BY p.created_at DESC",
	)
		.bind(session.user.id, inicioDelDia, finDelDia)
		.all();

	return c.json({ data: results });
});

app.get("/pomodoros/stats", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const fecha = c.req.query("fecha") || new Date().toISOString().split("T")[0];
	const inicioDelDia = new Date(fecha).getTime();
	const finDelDia = inicioDelDia + 86400000;

	const stats = await c.env.DB.prepare(
		"SELECT COUNT(*) as total, COALESCE(SUM(minutes_actual), 0) as totalTime FROM pomodoro WHERE tarea_id IN (SELECT id FROM tarea WHERE user_id = ?) AND created_at >= ? AND created_at < ? AND status IN ('completed', 'completed_early')",
	)
		.bind(session.user.id, inicioDelDia, finDelDia)
		.first();

	return c.json({ data: stats });
});

// ─── BREAKS ─────────────────────────────────────────────────

app.post("/breaks", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json();
	const parsed = crearBreakSchema.safeParse(body);
	if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

	const { tipo, status, minutesActual } = parsed.data;
	const minutesPlanned = tipo === "long" ? 15 : 5;

	const result = await c.env.DB.prepare(
		"INSERT INTO break (user_id, tipo, status, minutes_planned, minutes_actual, created_at) VALUES (?, ?, ?, ?, ?, ?)",
	)
		.bind(session.user.id, tipo, status, minutesPlanned, minutesActual || null, Date.now())
		.run();

	return c.json({ data: { id: result.meta.last_row_id, tipo, status, minutesPlanned, minutesActual } }, 201);
});

app.get("/breaks", async (c) => {
	const session = await getSession(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const fecha = c.req.query("fecha") || new Date().toISOString().split("T")[0];
	const inicioDelDia = new Date(fecha).getTime();
	const finDelDia = inicioDelDia + 86400000;

	const { results } = await c.env.DB.prepare(
		"SELECT id, tipo, status, minutes_planned as minutesPlanned, minutes_actual as minutesActual, created_at as createdAt, completed_at as completedAt FROM break WHERE user_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at",
	)
		.bind(session.user.id, inicioDelDia, finDelDia)
		.all();

	return c.json({ data: results });
});

// ─── BETTER AUTH ────────────────────────────────────────────

app.all("*", async (c) => {
	if (
		c.req.path.includes("/sign-in/email") ||
		c.req.path.includes("/sign-up/email")
	) {
		const kv = c.env.LUCIA_KV;
		if (kv) {
			const ip = c.req.header("cf-connecting-ip") || "unknown";
			const allowed = await checkRateLimit(kv, ip);
			if (!allowed) {
				return c.json(
					{ error: "Demasiados intentos. Por favor intente de nuevo en 5 minutos." },
					429,
				);
			}
		}
	}

	const turnstileToken = c.req.header("x-turnstile-token");
	const authInstance = auth(c.env.DB, c.env.LUCIA_KV, c.env);

	let requestHandler = c.req.raw;
	if (turnstileToken) {
		const headers = new Headers(c.req.raw.headers);
		if (!headers.has("x-turnstile-token")) {
			headers.set("x-turnstile-token", turnstileToken);
		}
		requestHandler = new Request(c.req.raw, { headers });
	}

	return authInstance.handler(requestHandler);
});

export const onRequest = handle(app);
