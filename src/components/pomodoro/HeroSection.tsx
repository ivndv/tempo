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

	// Modo default: muestra título completo con spans coloreados
	return (
		<div
			data-testid="hero"
			className="text-center space-y-4 mb-10 animate-fade-in-up"
		>
			{/* Título principal de la landing */}
			<h1 className="text-5xl md:text-6xl font-black bg-linear-to-r from-(--hero-title-from) to-(--hero-title-to) bg-clip-text text-transparent pb-3 tracking-tighter">
				{m.hero_title()}
			</h1>

			<div className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
				<p>
					{/* Primera parte del subtítulo */}
					{m.hero_subtitle().split(",")[0]} {/* Palabra "coding" coloreada */}
					<span className="text-(--hero-coding) font-extrabold">
						{m.hero_span_coding()}
					</span>
					, {/* Palabra "studying" coloreada */}
					<span className="text-(--hero-studying) font-extrabold">
						{m.hero_span_studying()}
					</span>{" "}
					{m.hero_or()} {/* Palabra "creating" coloreada */}
					<span className="text-(--hero-creating) font-extrabold">
						{m.hero_span_creating()}
					</span>
				</p>
				{/* Segunda parte del subtítulo */}
				<p>{m.hero_subtitle_part2()}</p>
			</div>
		</div>
	);
}
