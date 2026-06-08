// Store
import type { LogEntry } from "../../stores/slices/pomodoroSlice";

// Props del resumen diario
export interface DailySummaryProps {
	history: LogEntry[];
	hours: number;
	minutes: number;
	count: number;
}

// Props del resumen semanal
export interface WeeklySummaryProps {
	weeklyStats: {
		day: string;
		minutes: number;
		count: number;
	}[];
}
