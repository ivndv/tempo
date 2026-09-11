/** @jsxImportSource react */
// React

// Iconos
import { Icon } from "@iconify/react";
// React
import { useEffect, useState } from "react";
// Autenticación
import { authClient } from "../../lib/client/auth-client";
// Validaciones
import { signupSchema } from "../../lib/shared/validations";
import { cn } from "../../lib/utils";
// Paraglide
import * as m from "../../paraglide/messages";
import { getLocale, localizeHref, setLocale } from "../../paraglide/runtime";
// Store
import { useStore } from "../../stores/store";
// Componentes
import { Button, buttonVariants } from "../ui/button";

// Props del componente (interfaz local)
interface ResetPasswordFormProps {
	redirectPath: string;
	lang?: "es" | "en";
}

// Evalúa la fortaleza de la contraseña (0-3)
const checkStrength = (pass: string) => {
	if (!pass) return 0;
	let score = 0;
	if (pass.length >= 8) score++;
	if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
	if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
	return score;
};

// Formulario para restablecer la contraseña con token
export default function ResetPasswordForm({
	redirectPath,
	lang: propLang,
}: ResetPasswordFormProps) {
	const storeLang = useStore((s) => s.lang);
	const lang =
		propLang ??
		(redirectPath.startsWith("/en") ? "en" : (getLocale() ?? storeLang));
	if (typeof window !== "undefined" && getLocale() !== lang) {
		setLocale(lang, { reload: false });
	}
	const opt = { locale: lang };
	// Estados del formulario
	const [token, setToken] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [strength, setStrength] = useState(0);
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	// Extrae el token y errores de la URL al montar
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const tokenParam = params.get("token");
		const errorParam = params.get("error");

		if (errorParam) {
			setError(m.auth_error_generic({ locale: lang }));
		}

		if (tokenParam) {
			setToken(tokenParam);
		} else {
			setError(m.auth_error_generic({ locale: lang }));
		}
	}, [lang]);

	// Envía la nueva contraseña
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const result = signupSchema.safeParse({
			email: "reset@placeholder.com",
			password,
			confirmPassword,
		});
		if (!result.success) {
			setError(result.error.issues[0]?.message || m.auth_password_weak(opt));
			return;
		}

		setLoading(true);

		const { error: err } = await authClient.resetPassword({
			newPassword: password,
			token,
		});

		setLoading(false);

		if (err) {
			setError(err.message || m.auth_error_generic(opt));
			return;
		}

		setDone(true);
	};

	// Vista de confirmación de cambio exitoso
	if (done) {
		return (
			<div className="max-w-md w-full mx-4 text-center space-y-6 animate-fade-in-up">
				{/* Ícono de éxito */}
				<div className="text-6xl">✅</div>
				{/* Título y mensaje */}
				<h2 className="text-2xl font-bold">{m.auth_reset_title(opt)}</h2>
				<p className="text-sm opacity-70">{m.auth_reset_success(opt)}</p>
				{/* Volver al login */}
				<a
					href={localizeHref("/login", opt)}
					data-astro-reload
					className={cn(buttonVariants({ variant: "default" }))}
				>
					{m.auth_back_login(opt)}
				</a>
			</div>
		);
	}

	return (
		<div className="max-w-md w-full mx-4">
			<div className="bg-card/50 backdrop-blur-sm border border-border p-10 rounded-3xl shadow-2xl animate-fade-in-up">
				{/* Encabezado */}
				<div className="text-center space-y-2 mb-8">
					<div className="text-4xl">🔐</div>
					<h2 className="text-2xl font-bold">{m.auth_reset_title(opt)}</h2>
					<p className="text-sm opacity-70">{m.auth_reset_subtitle(opt)}</p>
				</div>

				{/* Formulario */}
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Campo de nueva contraseña */}
					<div className="group">
						<label
							htmlFor="password"
							className="block text-xs font-bold text-(--auth-label) uppercase tracking-widest mb-1.5 ml-1"
						>
							{m.auth_password_label(opt)}
						</label>
						{/* Input con icono y toggle de visibilidad */}
						<div className="relative group-focus-within:scale-[1.01] transition-transform">
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								autoComplete="new-password"
								required
								value={password}
								onChange={(e) => {
									setPassword(e.target.value);
									setStrength(checkStrength(e.target.value));
								}}
								className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-(--auth-border) bg-(--auth-input-bg) text-(--auth-text) placeholder-(--auth-placeholder) focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:z-10 sm:text-sm transition-all duration-300"
								placeholder={m.auth_password_placeholder(opt)}
							/>
							{/* Icono de candado */}
							<span className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none text-(--auth-label) group-focus-within:text-(--auth-accent) transition-colors">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							</span>
							{/* Toggle de visibilidad */}
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-0 inset-y-0 flex items-center pr-4 text-(--auth-placeholder) hover:text-(--auth-accent) transition-colors cursor-pointer z-20"
								aria-label={showPassword ? "Ocultar" : "Mostrar"}
							>
								{showPassword ? (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
										<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
										<path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
										<line x1="2" x2="22" y1="2" y2="22" />
									</svg>
								) : (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
										<circle cx="12" cy="12" r="3" />
									</svg>
								)}
							</button>
						</div>

						{/* Indicador de fortaleza */}
						{password && (
							<div className="mt-2 px-1">
								<div className="flex justify-between items-center mb-1">
									<span
										className={`text-[10px] font-bold uppercase tracking-wider ${
											strength <= 1
												? "text-red-500"
												: strength === 2
													? "text-yellow-500"
													: "text-green-500"
										}`}
									>
										{strength === 0
											? ""
											: strength === 1
												? m.auth_password_weak(opt)
												: strength === 2
													? m.auth_password_medium(opt)
													: m.auth_password_strong(opt)}
									</span>
									<span className="text-[10px] font-mono text-(--auth-placeholder)">
										{password.length}/8
									</span>
								</div>
								<div className="w-full h-1.5 bg-(--auth-border) rounded-full overflow-hidden">
									{/* Barra de progreso */}
									<div
										className={`h-full transition-all duration-500 rounded-full ${
											strength === 0
												? "w-0"
												: strength === 1
													? "w-1/3 bg-red-500"
													: strength === 2
														? "w-2/3 bg-yellow-500"
														: "w-full bg-green-500"
										}`}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Campo de confirmación de contraseña */}
					<div className="group">
						<label
							htmlFor="confirm-password"
							className="block text-xs font-bold text-(--auth-label) uppercase tracking-widest mb-1.5 ml-1"
						>
							{m.auth_confirm_password_label(opt)}
						</label>
						<div className="relative group-focus-within:scale-[1.01] transition-transform">
							<input
								id="confirm-password"
								type={showPassword ? "text" : "password"}
								autoComplete="new-password"
								required
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-(--auth-border) bg-(--auth-input-bg) text-(--auth-text) placeholder-(--auth-placeholder) focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:z-10 sm:text-sm transition-all duration-300"
								placeholder={m.auth_confirm_password_placeholder(opt)}
							/>
							{/* Icono de candado */}
							<span className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none text-(--auth-label) group-focus-within:text-(--auth-accent) transition-colors">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							</span>
						</div>
					</div>

					{/* Mensaje de error */}
					{error && (
						<div className="text-sm text-error bg-error/10 border border-error/20 rounded-xl p-3 animate-fade-in">
							{error}
						</div>
					)}

					{/* Botón de enviar */}
					<Button
						type="submit"
						disabled={loading || !password || !confirmPassword || !token}
						className="h-14 w-full text-sm font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
					>
						{loading ? (
							<Icon icon="lucide:loader-circle" className="animate-spin" />
						) : (
							m.auth_reset_btn(opt)
						)}
					</Button>

					{/* Volver al login */}
					<div className="text-center pt-2">
						<a
							href={localizeHref("/login", opt)}
							data-astro-reload
							className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
						>
							{m.auth_back_login(opt)}
						</a>
					</div>
				</form>
			</div>
		</div>
	);
}
