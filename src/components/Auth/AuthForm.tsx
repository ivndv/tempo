/** @jsxImportSource react */
// Turnstile
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
// React
import type React from "react";
import { useRef, useState } from "react";
// Autenticación
import { authClient, signIn, signUp } from "../../lib/auth-client";
// Validaciones
import { loginSchema, signupSchema } from "../../lib/validations";
// Utilidades
import { checkStrength } from "../../lib/password";
import { useStore } from "../../stores/store";
import { useTranslations } from "../../i18n/utils";

// Props del componente (interfaz local)
interface AuthFormProps {
	redirectPath: string;
}

// Maneja login y registro con validación y Turnstile
export default function AuthForm({ redirectPath }: AuthFormProps) {
	const t = useTranslations(useStore((s) => s.lang));
	// Estados del formulario
	const [isLogin, setIsLogin] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [strength, setStrength] = useState(0);
	const [signupDone, setSignupDone] = useState(false);
	const turnstileRef = useRef<TurnstileInstance>(null);

	// Cambia entre login y registro, resetea estados
	const toggleMode = () => {
		setIsLogin(!isLogin);
		setError(null);
		setTurnstileToken(null);
		setPassword("");
		setConfirmPassword("");
		setStrength(0);
		turnstileRef.current?.reset();
	};

	// Actualiza la contraseña y su fortaleza
	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setPassword(val);
		setStrength(checkStrength(val));
	};

	// Maneja el envío del formulario (login o registro)
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		if (!turnstileToken) {
			setError(t("auth.captcha.required"));
			return;
		}

		const formData = new FormData(e.currentTarget);
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;
		const confirmPassword = formData.get("confirmPassword") as string;

		if (isLogin) {
			const result = loginSchema.safeParse({ email, password });
			if (!result.success) {
				setError(result.error.issues[0]?.message || t("auth.error.generic"));
				return;
			}
		} else {
			const result = signupSchema.safeParse({
				email,
				password,
				confirmPassword,
			});
			if (!result.success) {
				setError(result.error.issues[0]?.message || t("auth.password.weak"));
				return;
			}
		}

		setLoading(true);

		try {
			if (isLogin) {
				const { error } = await signIn.email({
					email,
					password,
					fetchOptions: {
						headers: {
							// El token se pasa en el header para ser procesado por el hook en el servidor
							"x-captcha-response": turnstileToken,
						},
					},
				});
				if (error) throw new Error(error.message || t("auth.error.generic"));
			} else {
				// --- Proceso de Registro ---
				const { error } = await signUp.email({
					email,
					password,
					name: email.split("@")[0] || "User",
					fetchOptions: {
						headers: {
							"x-captcha-response": turnstileToken,
						},
					},
				});
				if (error) throw new Error(error.message || t("auth.error.generic"));

				// autoSignIn: false → mostrar mensaje de verificación
				authClient.sendVerificationEmail({
					email,
					callbackURL: "/?verified=true",
				});
				setSignupDone(true);
				setLoading(false);
				setTurnstileToken(null);
				turnstileRef.current?.reset();
				return;
			}

			// Si todo sale bien, redirigir a la ruta especificada
			window.location.href = redirectPath;
		} catch (err: unknown) {
			// Manejo de errores: Mostramos el mensaje y reseteamos el CAPTCHA por seguridad
			setError(err instanceof Error ? err.message : "Error desconocido");
			setLoading(false);
			setTurnstileToken(null);
			turnstileRef.current?.reset();
		}
	};

	if (signupDone) {
		return (
			<div className="max-w-md w-full mx-4 text-center space-y-6 animate-fade-in-up">
				<div className="text-6xl">📧</div>
				<h2 className="text-2xl font-bold">
					{t("auth.emailVerificationSent")}
				</h2>
				<p className="text-sm opacity-70">
					{t("auth.signupSuccess") ||
						"Te enviamos un link de verificación. Revisa tu bandeja de entrada."}
				</p>
				<a href={redirectPath} className="btn btn-primary">
					{t("auth.backHome")}
				</a>
			</div>
		);
	}

	return (
		<div className="max-w-md w-full space-y-8 bg-base-100/50 backdrop-blur-sm border border-base-200 p-10 rounded-3xl shadow-2xl animate-fade-in transition-all duration-300">
			{/* Cabecera del Formulario */}
			<div className="text-center space-y-2">
				<h2
					key={isLogin ? "login-title" : "signup-title"}
					className="text-4xl font-black bg-linear-to-r from-(--auth-title-from) to-(--auth-title-to) bg-clip-text text-transparent font-[Outfit] tracking-tight py-1 animate-fade-in-up"
				>
					{isLogin ? t("auth.login.title") : t("auth.signup.title")}
				</h2>
				<p
					key={isLogin ? "login-sub" : "signup-sub"}
					className="text-sm text-(--auth-text-secondary) font-medium"
				>
					{isLogin ? t("auth.login.subtitle") : t("auth.signup.subtitle")}{" "}
					<button
						onClick={toggleMode}
						type="button"
						className="text-[var(--auth-accent)] hover:text-[var(--auth-accent-hover)] underline underline-offset-4 transition-all cursor-pointer font-bold"
					>
						{isLogin ? t("auth.btn.toggle.signup") : t("auth.btn.toggle.login")}
					</button>
				</p>
			</div>

			<form
				key={isLogin ? "login-form" : "signup-form"}
				className="mt-8 space-y-6"
				onSubmit={handleSubmit}
			>
				<div className="space-y-4">
					{/* Campo de Correo Electrónico */}
					<div className="group">
						<label
							htmlFor="email-address"
							className="block text-xs font-bold text-(--auth-label) uppercase tracking-widest mb-1.5 ml-1"
						>
							{t("auth.email.label")}
						</label>
						<div className="relative group-focus-within:scale-[1.01] transition-transform">
							<input
								id="email-address"
								name="email"
								type="email"
								autoComplete="email"
								required
								className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-(--auth-border) bg-(--auth-input-bg) text-(--auth-text) placeholder-(--auth-placeholder) focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:z-10 sm:text-sm transition-all duration-300"
								placeholder={t("auth.email.placeholder")}
							/>
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
									<rect width="20" height="16" x="2" y="4" rx="2" />
									<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
								</svg>
							</span>
						</div>
					</div>

					{/* Campo de Contraseña con opción de visualización */}
					<div className="group">
						<label
							htmlFor="password"
							ext-id="password-label"
							className="block text-xs font-bold text-(--auth-label) uppercase tracking-widest mb-1.5 ml-1"
						>
							{t("auth.password.label")}
						</label>
						<div className="relative group-focus-within:scale-[1.01] transition-transform">
							<input
								id="password"
								name="password"
								type={showPassword ? "text" : "password"}
								autoComplete="current-password"
								required
								value={password}
								onChange={handlePasswordChange}
								className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-(--auth-border) bg-(--auth-input-bg) text-(--auth-text) placeholder-(--auth-placeholder) focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:z-10 sm:text-sm transition-all duration-300"
								placeholder={t("auth.password.placeholder")}
							/>
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
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-0 inset-y-0 flex items-center pr-4 text-(--auth-placeholder) hover:text-(--auth-accent) transition-colors cursor-pointer z-20"
								aria-label={
									showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
								}
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

						{!isLogin && password && (
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
												? t("auth.password.weak")
												: strength === 2
													? t("auth.password.medium")
													: t("auth.password.strong")}
									</span>
									<span className="text-[10px] font-mono text-(--auth-placeholder)">
										{password.length}/8
									</span>
								</div>
								<div className="w-full h-1.5 bg-(--auth-border) rounded-full overflow-hidden">
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
						{isLogin && (
							<div className="mt-2 text-right">
								<a
									href={t("auth.forgot.link")}
									data-astro-reload
									className="text-xs font-medium text-(--auth-accent) hover:text-(--auth-accent-hover) underline underline-offset-4 transition-colors"
								>
									{t("auth.forgot.link")}
								</a>
							</div>
						)}
					</div>
					{!isLogin && (
						<div className="group">
							<label
								htmlFor="confirm-password"
								className="block text-xs font-bold text-(--auth-label) uppercase tracking-widest mb-1.5 ml-1"
							>
								{t("auth.confirmPassword.label")}
							</label>
							<div className="relative group-focus-within:scale-[1.01] transition-transform">
								<input
									id="confirm-password"
									name="confirmPassword"
									type={showPassword ? "text" : "password"}
									autoComplete="new-password"
									required
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-(--auth-border) bg-(--auth-input-bg) text-(--auth-text) placeholder-(--auth-placeholder) focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:z-10 sm:text-sm transition-all duration-300"
									placeholder={t("auth.confirmPassword.placeholder")}
								/>
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
					)}
				</div>

				{/* Sección de Mensajes de Error */}
				{error && (
					<div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-950/50 py-3 px-4 rounded-xl border border-red-200 dark:border-red-800/30 animate-fade-in">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							className="shrink-0"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						<span>{error}</span>
					</div>
				)}

				{/* Widget de Verificación Turnstile */}
				<div className="w-full py-2">
					<Turnstile
						ref={turnstileRef}
						siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}
						options={{
							theme: "auto",
							size: "flexible",
						}}
						onSuccess={(token) => setTurnstileToken(token)}
						onError={() => {
							setTurnstileToken(null);
							setError(t("auth.captcha.error"));
						}}
						onExpire={() => {
							setTurnstileToken(null);
							setError(t("auth.captcha.expired"));
						}}
					/>
				</div>

				{/* Botón de Envío */}
				<div>
					<button
						type="submit"
						disabled={loading}
						className="btn btn-primary w-full h-14 text-sm font-black rounded-2xl border-none shadow-lg hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
					>
						{loading ? (
							<span className="flex items-center space-x-2">
								<svg
									className="animate-spin h-5 w-5 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								<span>{t("auth.loading")}</span>
							</span>
						) : (
							<span className="flex items-center space-x-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="opacity-70 group-hover:rotate-12 transition-transform"
									aria-hidden="true"
								>
									<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
									<polyline points="10 17 15 12 10 7" />
									<line x1="15" y1="12" x2="3" y2="12" />
								</svg>
								<span>
									{isLogin ? t("auth.btn.login") : t("auth.btn.signup")}
								</span>
							</span>
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
