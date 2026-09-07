// Evalúa la fortaleza de la contraseña (0 = vacía, 3 = fuerte)
export function checkStrength(pass: string): number {
	if (!pass) return 0;
	let score = 0;
	if (pass.length >= 8) score++;
	if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
	if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
	return score;
}
