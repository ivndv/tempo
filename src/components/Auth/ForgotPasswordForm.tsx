/** @jsxImportSource react */
// React
import { useState } from "react";
// Autenticación
import { authClient } from "../../lib/auth-client";
// i18n
import { useTranslations } from "../../i18n/utils";
// Store
import { useStore } from "../../stores/store";

// Props del componente (interfaz local)
interface ForgotPasswordFormProps {
	redirectPath: string;
}

// Formulario para solicitar restablecimiento de contraseña
export default function ForgotPasswordForm({
	redirectPath,
}: ForgotPasswordFormProps) {
	const t = useTranslations(useStore((s) => s.lang));
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

		const { error: err } = await authClient.requestPasswordReset({
			email,
			redirectTo: redirectPath.replace("/login", "/reset-password"),
		});

		setLoading(false);

		if (err) {
			setError(err.message || t("auth.error.generic"));
			return;
		}

		setSent(true);
	};

	// Vista de confirmación de envío
	if (sent) {
		return (
			<div className="max-w-md w-full mx-4 text-center space-y-6 animate-fade-in-up">
				{/* Ícono de email enviado */}
				<div className="text-6xl">📧</div>
				{/* Título y mensaje */}
				<h2 className="text-2xl font-bold">{t("auth.forgot.title")}</h2>
				<p className="text-sm opacity-70">{t("auth.forgot.sent")}</p>
				{/* Volver al inicio */}
				<a href={redirectPath} className="btn btn-primary">
					{t("auth.backHome")}
				</a>
			</div>
		);
	}

	return (
		<div className="max-w-md w-full mx-4">
			<div className="bg-base-100/50 backdrop-blur-sm border border-base-200 p-10 rounded-3xl shadow-2xl animate-fade-in-up">
				{/* Encabezado */}
				<div className="text-center space-y-2 mb-8">
					<div className="text-4xl">🔑</div>
					<h2 className="text-2xl font-bold">{t("auth.forgot.title")}</h2>
					<p className="text-sm opacity-70">{t("auth.forgot.subtitle")}</p>
				</div>

				{/* Formulario */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Campo de email */}
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-bold opacity-80 mb-2"
						>
							{t("auth.email.label")}
						</label>
						<input
							id="email"
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={t("auth.email.placeholder")}
							className="input input-bordered w-full h-12 rounded-xl"
						/>
					</div>

					{/* Mensaje de error */}
					{error && (
						<div className="text-sm text-error bg-error/10 border border-error/20 rounded-xl p-3 animate-fade-in">
							{error}
						</div>
					)}

					{/* Botón de enviar */}
					<button
						type="submit"
						disabled={loading || !email}
						className="btn btn-primary w-full h-12 rounded-xl font-bold"
					>
						{loading ? (
							<span className="loading loading-spinner loading-sm" />
						) : (
							t("auth.forgot.btn")
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
