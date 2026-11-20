const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim();

export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '/api';
  }

  if (!rawApiBaseUrl) {
    return '/api';
  }

  return rawApiBaseUrl.replace(/\/+$/, '');
}

export function getBackendBaseUrl(): string {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl === '/api') {
    return window.location.origin;
  }

  return apiBaseUrl.replace(/\/api$/, '');
}
