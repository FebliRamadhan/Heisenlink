import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// Create API instance
// NOTE: Do not set a global Content-Type default. Axios sets `application/json`
// automatically for object bodies; setting it here breaks FormData uploads
// (axios 1.x silently JSON-stringifies FormData when a JSON Content-Type is
// already present, so multer sees an empty body).
const api = axios.create({
    baseURL: '/api',
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // DEBUG: Check if token is attached
        console.log(`[API] Request ${config.method?.toUpperCase()} ${config.url}`, {
            hasToken: !!token,
            headers: config.headers
        });
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Skip if request is specialized validation that might return 401
            if (originalRequest.headers['X-Ignore-401']) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;

                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Call refresh endpoint
                const response = await axios.post('/api/auth/refresh', { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                // Update store
                useAuthStore.getState().setTokens(accessToken, newRefreshToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Logout if refresh fails
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
