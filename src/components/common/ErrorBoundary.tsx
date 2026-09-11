/** @jsxImportSource react */
// React
import { Component, type ErrorInfo, type ReactNode } from "react";
// Paraglide
import * as m from "../../paraglide/messages";
// Componentes
import { Button } from "../ui/button";

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
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="flex items-center justify-center min-h-[200px]">
						<div className="text-center space-y-4 p-8">
							<div className="text-4xl">💥</div>
							<h2 className="text-xl font-bold">{m.error_title()}</h2>
							<p className="text-sm opacity-70">{m.error_message()}</p>
							<Button type="button" onClick={() => window.location.reload()}>
								{m.error_reload()}
							</Button>
						</div>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
