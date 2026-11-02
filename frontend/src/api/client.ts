import axios from 'axios';

/**
 * Resolves and normalizes the backend API base URL across dev and production.
 * Handles trailing slashes, missing '/api' suffixes, and hosting platform misconfigurations.
 */
export function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();

  if (envUrl) {
    // Strip trailing slashes
    const cleanUrl = envUrl.replace(/\/+$/, '');
    // If the URL does not end with /api, append it automatically
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // In local development mode, fallback to localhost:5000/api
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }

  // In production if VITE_API_URL is missing, default to relative /api
  // This allows reverse-proxies / rewrite rules to handle API calls
  return '/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 seconds timeout to accommodate Render free-tier cold starts
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('worksphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on login or health endpoints
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('worksphere_token');
        localStorage.removeItem('worksphere_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
