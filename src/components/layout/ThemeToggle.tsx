import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/stores/store";

export default function ThemeToggle() {
	const theme = useStore((s) => s.theme);
	const setTheme = useStore((s) => s.setTheme);

	const isDark = theme === "business";

	return (
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label="Toggle theme"
			onClick={() => setTheme(isDark ? "nord" : "business")}
		>
			{isDark ? <Icon icon="lucide:sun" /> : <Icon icon="lucide:moon" />}
		</Button>
	);
}
