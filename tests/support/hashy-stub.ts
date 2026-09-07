// Stub determinista de hashing para tests E2E (sin depender de Docker)
import { createServer } from "node:http";

const PORT = Number(process.env.HASHY_STUB_PORT || 3010);

const send = (
	res: import("node:http").ServerResponse,
	status: number,
	body: unknown,
) => {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
	const url = new URL(req.url || "/", "http://localhost");

	// Chequeo de salud previo a hash/verify (GET /health)
	if (req.method === "GET" && url.pathname === "/health") {
		return send(res, 200, { status: "ok" });
	}

	if (req.method !== "POST") {
		return send(res, 405, { error: "Método no soportado" });
	}

	let body: unknown;
	try {
		body = await new Promise((resolve, reject) => {
			let data = "";
			req.on("data", (chunk) => (data += chunk));
			req.on("end", () => {
				try {
					resolve(JSON.parse(data || "{}"));
				} catch {
					reject(new Error("JSON inválido"));
				}
			});
		});
	} catch {
		return send(res, 400, { error: "JSON inválido" });
	}

	// Hash: devuelve un hash simbólico (la app solo usa el string)
	if (url.pathname === "/hash") {
		const { password } = body as { password?: string };
		if (typeof password !== "string") {
			return send(res, 400, { error: "password requerida" });
		}
		return send(res, 200, { data: { hash: "argon2id$stub$e2e" } });
	}

	// Verify: siempre coincide (los tests E2E prueban la app, no a hashy)
	if (url.pathname === "/verify") {
		const { password, hash } = body as { password?: string; hash?: string };
		if (typeof password !== "string" || typeof hash !== "string") {
			return send(res, 400, { error: "password y hash requeridos" });
		}
		return send(res, 200, { data: { match: true } });
	}

	return send(res, 404, { error: "Ruta no encontrada" });
}).listen(PORT, () => {
	console.log(`[hashy-stub] escuchando en :${PORT}`);
});
