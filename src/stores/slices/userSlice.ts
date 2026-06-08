// Información básica del usuario autenticado
export interface UserInfo {
	id: string;
	email: string;
	name: string;
}

// Slice de autenticación y sesión
export interface UserSlice {
	user: UserInfo | null;
	isLoggedIn: boolean;
	sessionLoading: boolean;
	setUser: (session: { user: UserInfo } | null) => void;
	setSessionDone: () => void;
}

// Crea el slice de usuario (autenticación)
export const crearSliceUsuario = (
	set: (
		partial: Partial<UserSlice> | ((state: UserSlice) => Partial<UserSlice>),
	) => void,
): UserSlice => ({
	user: null,
	isLoggedIn: false,
	sessionLoading: true,

	setUser: (session) => {
		if (!session) {
			set({ user: null, isLoggedIn: false, sessionLoading: false });
			return;
		}
		set({
			user: {
				id: session.user.id,
				email: session.user.email,
				name: session.user.name,
			},
			isLoggedIn: true,
			sessionLoading: false,
		});
	},

	setSessionDone: () => {
		set({ sessionLoading: false });
	},
});
