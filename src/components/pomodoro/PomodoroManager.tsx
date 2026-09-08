/** @jsxImportSource react */
// React
import { useEffect } from "react";
// Store
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../stores/store";
import VerifiedHandler from "../auth/VerifiedHandler";
import ErrorBoundary from "../common/ErrorBoundary";
import { toast } from "../ui/toast";
// Componentes
import BreakTimer from "./BreakTimer";
import HeroSection from "./HeroSection";
import TaskSelector from "./TaskSelector";
import TimerView from "./TimerView";

// Props del componente (interfaz local)
interface PomodoroManagerProps {
	lang?: "es" | "en";
}

// Orquesta el flujo principal de la app (hero, temporizador, tareas)
export default function PomodoroManager({ lang = "es" }: PomodoroManagerProps) {
	const {
		initTareas,
		initCategorias,
		createTarea,
		selectTarea,
		pomodoroActivo,
		breakActivo,
		iniciar,
		initPomodoros,
		setLang,
		isLoggedIn,
		toasts,
	} = useStore(
		useShallow((s) => ({
			initTareas: s.initTareas,
			initCategorias: s.initCategorias,
			createTarea: s.createTarea,
			selectTarea: s.selectTarea,
			pomodoroActivo: s.pomodoroActivo,
			breakActivo: s.breakActivo,
			iniciar: s.iniciar,
			initPomodoros: s.initPomodoros,
			setLang: s.setLang,
			isLoggedIn: s.isLoggedIn,
			toasts: s.toasts,
		})),
	);

	// Sincroniza el idioma del store con el de la página
	useEffect(() => {
		setLang(lang);
	}, [lang, setLang]);

	// Puente store → toasts Base UI (el Toaster vive en el Layout)
	useEffect(() => {
		if (toasts.length === 0) return;
		const last = toasts[toasts.length - 1];
		toast.add({
			title: last.title,
			description: last.message,
			type: last.type,
		});
	}, [toasts]);

	// Inicializa datos al montar y de nuevo cuando la sesión resuelve,
	// para que el fetch a la nube no dependa de un race con la sesión
	// biome-ignore lint/correctness/useExhaustiveDependencies: isLoggedIn re-inicializa los datos al resolver la sesión (intencional)
	useEffect(() => {
		initTareas();
		initCategorias();
		initPomodoros();
	}, [isLoggedIn, initTareas, initCategorias, initPomodoros]);

	// Crea una nueva tarea y la inicia inmediatamente
	const handleStartTask = async (nombre: string, categoriaId?: number) => {
		const tarea = await createTarea(nombre, categoriaId);
		if (tarea) {
			selectTarea(tarea);
			iniciar(tarea.id);
		}
	};

	// Inicia un pomodoro con una tarea existente
	const handleSelectTask = (tareaId: number) => {
		iniciar(tareaId);
	};

	return (
		<ErrorBoundary>
			<VerifiedHandler />
			<div className="w-full">
				{/* Hero con modo focus o default según el estado */}
				<HeroSection mode={pomodoroActivo ? "focus" : "default"} />

				{pomodoroActivo ? (
					<TimerView />
				) : breakActivo ? (
					<BreakTimer />
				) : (
					<TaskSelector
						onSelectTask={handleSelectTask}
						onCreateTask={handleStartTask}
					/>
				)}
			</div>
		</ErrorBoundary>
	);
}
