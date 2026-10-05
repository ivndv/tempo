// Regla de rate limiting: ventana en segundos y máximo de peticiones
export type RateLimitRule = {
	window: number;
	max: number;
};

// Resultado de consumir una petición contra una regla
export type RateLimitResult = {
	allowed: boolean;
	limit: number;
	remaining: number;
	resetAt: number;
	retryAfter: number;
};

// Store que registra el consumo de una clave bajo una regla
export type RateLimitStore = {
	consume: (key: string, rule: RateLimitRule) => Promise<RateLimitResult>;
};
