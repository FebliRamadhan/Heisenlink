import { useAuthStore } from '@/stores/auth-store';
import { useState, useEffect } from 'react';

export const useAuth = () => {
    const store = useAuthStore();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Wait for Zustand to hydrate from localStorage
        // This prevents false "not authenticated" during SSR/hydration
        setIsHydrated(true);
    }, []);

    return {
        user: store.user,
        isAuthenticated: store.isAuthenticated,
        isLoading: !isHydrated, // true until localStorage is loaded
        login: store.login,
        logout: store.logout,
    };
};
