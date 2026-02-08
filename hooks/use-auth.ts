import { useAuthStore } from '@/stores/auth-store';

export const useAuth = () => {
    const store = useAuthStore();

    return {
        user: store.user,
        isAuthenticated: store.isAuthenticated,
        isLoading: false, // Can add loading state if needed
        login: store.login,
        logout: store.logout,
    };
};
