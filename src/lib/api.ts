export const getBackendUrl = (): string => {
  if (typeof window === 'undefined') return "http://localhost:5000";
  
  // 1. Check local storage override
  const savedUrl = localStorage.getItem("stufflas_backend_url");
  if (savedUrl) return savedUrl;
  
  // 2. Check environment variable
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL as string;
  }
  
  // 3. Fallback to same origin if not running on localhost
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  
  // 4. Default fallback to localhost port 5000
  return "http://localhost:5000";
};

export const backendUrl = getBackendUrl();
