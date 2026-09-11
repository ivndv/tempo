/** @jsxImportSource react */
// React

// Iconos
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
// Autenticación
import { authClient } from "../../lib/client/auth-client";
import { cn } from "../../lib/utils";
// Paraglide
import * as m from "../../paraglide/messages";
import { getLocale, localizeHref, setLocale } from "../../paraglide/runtime";
// Store
import { useStore } from "../../stores/store";
// Componentes
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";

// Props del componente (interfaz local)
interface ForgotPasswordFormProps {
	redirectPath: string;
	lang?: "es" | "en";
}

// Formulario para solicitar restablecimiento de contraseña
export default function ForgotPasswordForm({
	redirectPath,
	lang: propLang,
}: ForgotPasswordFormProps) {
	const storeLang = useStore((s) => s.lang);
	const lang =
		propLang ??
		(redirectPath.startsWith("/en") ? "en" : (getLocale() ?? storeLang));
	if (typeof window !== "undefined" && getLocale() !== lang) {
		setLocale(lang, { reload: false });
	}
	const opt = { locale: lang };
	const isLoggedIn = useStore((s) => s.isLoggedIn);
	const sessionLoading = useStore((s) => s.sessionLoading);

	// Redirige al home si ya hay sesión activa (evita re-solicitar reset)
	useEffect(() => {
		if (sessionLoading || !isLoggedIn) return;
		window.location.replace(redirectPath);
	}, [sessionLoading, isLoggedIn, redirectPath]);
	// Estados del formulario
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Envía la solicitud de restablecimiento
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const origin = typeof window !== "undefined" ? window.location.origin : "";
		const resetPath = localizeHref("/reset-password", opt);

		const { error: err } = await authClient.requestPasswordReset({
			email,
			redirectTo: `${origin}${resetPath}`,
		});

		setLoading(false);

		if (err) {
			setError(err.message || m.auth_error_generic(opt));
			return;
		}

		setSent(true);
	};

	// Vista de confirmación de envío
	if (sessionLoading || isLoggedIn) {
		return null;
	}

	if (sent) {
		return (
			<div className="max-w-md w-full mx-4 text-center space-y-6 animate-fade-in-up">
				{/* Ícono de email enviado */}
				<div className="text-6xl">📧</div>
				{/* Título y mensaje */}
				<h2 className="text-2xl font-bold">{m.auth_forgot_title(opt)}</h2>
				<p className="text-sm opacity-70">{m.auth_forgot_sent(opt)}</p>
				{/* Volver al inicio */}
				<a
					href={redirectPath}
					className={cn(buttonVariants({ variant: "default" }))}
				>
					{m.auth_back_home(opt)}
				</a>
			</div>
		);
	}

	return (
		<div className="max-w-md w-full mx-4">
			<div className="bg-card/50 backdrop-blur-sm border border-border p-10 rounded-3xl shadow-2xl animate-fade-in-up">
				{/* Encabezado */}
				<div className="text-center space-y-2 mb-8">
					<div className="text-4xl">🔑</div>
					<h2 className="text-2xl font-bold">{m.auth_forgot_title(opt)}</h2>
					<p className="text-sm opacity-70">{m.auth_forgot_subtitle(opt)}</p>
				</div>

				{/* Formulario */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Campo de email */}
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-bold opacity-80 mb-2"
						>
							{m.auth_email_label(opt)}
						</label>
						<Input
							id="email"
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={m.auth_email_placeholder(opt)}
							className="h-12 rounded-xl"
						/>
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
						disabled={loading || !email}
						className="h-12 w-full rounded-xl font-bold"
					>
						{loading ? (
							<Icon icon="lucide:loader-circle" className="animate-spin" />
						) : (
							m.auth_forgot_btn(opt)
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
