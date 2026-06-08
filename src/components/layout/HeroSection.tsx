/** @jsxImportSource react */
// i18n
import { useTranslations } from "../../i18n/utils";
// Store
import { useStore } from "../../stores/store";

// Define las props del componente (interfaz local)
interface HeroSectionProps {
	mode: "default" | "focus";
}

// Renderiza la sección hero según el modo (focus o default)
export default function HeroSection({ mode }: HeroSectionProps) {
	const t = useTranslations(useStore((s) => s.lang));

	// Modo focus: muestra título corto para la vista de temporizador
	if (mode === "focus") {
		return (
			<div className="text-center space-y-4 mb-10 animate-fade-in-up">
				{/* Título del modo focus */}
				<h1 className="text-5xl font-extrabold text-primary">
					{t("hero.focus.title")}
				</h1>
				{/* Subtítulo del modo focus */}
				<p className="text-xl text-base-content/80 max-w-2xl mx-auto">
					{t("hero.focus.subtitle")}
				</p>
			</div>
		);
	}

	// Modo default: muestra título completo con spans coloreados
	return (
		<div className="text-center space-y-4 mb-10 animate-fade-in-up">
			{/* Título principal de la landing */}
			<h1 className="text-5xl md:text-6xl font-black bg-linear-to-r from-(--hero-title-from) to-(--hero-title-to) bg-clip-text text-transparent pb-3 tracking-tighter">
				{t("hero.title")}
			</h1>

			<div className="text-xl text-base-content/70 max-w-2xl mx-auto font-medium leading-relaxed">
				<p>
					{/* Primera parte del subtítulo */}
					{t("hero.subtitle").split(",")[0]}{" "}
					{/* Palabra "coding" coloreada */}
					<span className="text-(--hero-coding) font-extrabold">
						{t("hero.span.coding")}
					</span>
					,{" "}
					{/* Palabra "studying" coloreada */}
					<span className="text-(--hero-studying) font-extrabold">
						{t("hero.span.studying")}
					</span>{" "}
					{t("hero.or")}{" "}
					{/* Palabra "creating" coloreada */}
					<span className="text-(--hero-creating) font-extrabold">
						{t("hero.span.creating")}
					</span>
				</p>
				{/* Segunda parte del subtítulo */}
				<p className="opacity-80">{t("hero.subtitle.part2")}</p>
			</div>
		</div>
	);
}
