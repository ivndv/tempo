/** @jsxImportSource react */
// React
import { useEffect } from "react";
// Store
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../stores/store";
// Componentes
import BreakTimer from "../timer/BreakTimer";
import ErrorBoundary from "../ui/ErrorBoundary";
import HeroSection from "../layout/HeroSection";
import TaskSelector from "../tasks/TaskSelector";
import TimerView from "../timer/TimerView";
import Toast from "../ui/Toast";
import VerifiedHandler from "../Auth/VerifiedHandler";

// Props del componente (interfaz local)
interface PomodoroManagerProps {
	lang?: "es" | "en";
}

// Orquesta el flujo principal de la app (hero, temporizador, tareas)
export default function PomodoroManager({ lang = "es" }: PomodoroManagerProps) {
	const {
		isLoggedIn,
		initTareas,
		initCategorias,
		createTarea,
		selectTarea,
		pomodoroActivo,
		breakActivo,
		iniciar,
		initPomodoros,
		setLang,
	} = useStore(
		useShallow((s) => ({
			isLoggedIn: s.isLoggedIn,
			initTareas: s.initTareas,
			initCategorias: s.initCategorias,
			createTarea: s.createTarea,
			selectTarea: s.selectTarea,
			pomodoroActivo: s.pomodoroActivo,
			breakActivo: s.breakActivo,
			iniciar: s.iniciar,
			initPomodoros: s.initPomodoros,
			setLang: s.setLang,
		})),
	);

	// Sincroniza el idioma del store con el de la página
	useEffect(() => {
		setLang(lang);
	}, [lang, setLang]);

	// Inicializa datos al montar el componente o cambiar sesión
	useEffect(() => {
		initTareas(isLoggedIn);
		initCategorias(isLoggedIn);
		initPomodoros(isLoggedIn);
	}, [isLoggedIn, initTareas, initCategorias, initPomodoros]);

	// Crea una nueva tarea y la inicia inmediatamente
	const handleStartTask = async (nombre: string, categoriaId?: number) => {
		const tarea = await createTarea(nombre, isLoggedIn, categoriaId);
		if (tarea) {
			selectTarea(tarea);
			iniciar(tarea.id, isLoggedIn);
		}
	};

	// Inicia un pomodoro con una tarea existente
	const handleSelectTask = (tareaId: number) => {
		iniciar(tareaId, isLoggedIn);
	};

	return (
		<ErrorBoundary>
			<VerifiedHandler />
			<Toast />
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
