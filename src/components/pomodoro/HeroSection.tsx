/** @jsxImportSource react */
// Paraglide
import * as m from "../../paraglide/messages";

// Define las props del componente (interfaz local)
interface HeroSectionProps {
	mode: "default" | "focus";
}

// Renderiza la sección hero según el modo (focus o default)
export default function HeroSection({ mode }: HeroSectionProps) {
	// Modo focus: muestra título corto para la vista de temporizador
	if (mode === "focus") {
		return (
			<div className="text-center space-y-4 mb-10 animate-fade-in-up">
				{/* Título del modo focus */}
				<h1 className="text-5xl font-extrabold text-primary">
					{m.hero_focus_title()}
				</h1>
				{/* Subtítulo del modo focus */}
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
					{m.hero_focus_subtitle()}
				</p>
			</div>
		);
	}

	// Modo default: texto breve, la presentación larga vive en la landing
	return (
		<div
			data-testid="hero"
			className="text-center space-y-3 mb-10 animate-fade-in-up"
		>
			<h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
				{m.app_title()}
			</h1>
			<p className="text-lg text-muted-foreground max-w-xl mx-auto font-medium leading-relaxed">
				{m.app_subtitle()}
			</p>
		</div>
	);
}
