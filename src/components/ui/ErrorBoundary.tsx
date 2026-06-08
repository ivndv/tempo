/** @jsxImportSource react */
// React
import { Component, type ErrorInfo, type ReactNode } from "react";
// i18n
import { useTranslations } from "../../i18n/utils";
// Store
import { useStore } from "../../stores/store";

// Props del componente (interfaz local)
interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

// Estado interno del error boundary
interface State {
	hasError: boolean;
}

// Atrapa errores de los hijos para evitar que se caiga toda la app
export default class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	// Cambia el estado cuando un hijo lanza un error
	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	// Logea el error a la consola
	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("[ErrorBoundary]", error, errorInfo);
	}

	// Renderiza el fallback o los hijos según el estado
	render() {
		// biome-ignore lint/correctness/useHookAtTopLevel: class component no soporta hooks, patrón válido
		const t = useTranslations(useStore.getState().lang);

		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="flex items-center justify-center min-h-[200px]">
						<div className="text-center space-y-4 p-8">
							<div className="text-4xl">💥</div>
							<h2 className="text-xl font-bold">{t("error.title")}</h2>
							<p className="text-sm opacity-70">
								{t("error.message")}
							</p>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="btn btn-primary"
							>
								{t("error.reload")}
							</button>
						</div>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
