// lib/apiConfig.ts

// ✅ تابع به‌جای ثابت — هر بار که صدا زده می‌شه، مقدار درست می‌ده
const getApiBaseUrl = (): string => {
  // اول env variable رو چک کن (بالاترین اولویت — هم SSR هم client)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // فقط در client-side می‌تونیم window رو بخونیم
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;

    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${protocol}//${host}:8000/api`;
    }
  }

  return 'http://127.0.0.1:8000/api';
};

// ✅ دیگه ثابت نیست — تابع‌ه تا همیشه مقدار درست بده
const API_BASE_URL = getApiBaseUrl();

const getApiBaseUrlClient = (): string => getApiBaseUrl();

const getAuthHeaders = (isFormData: boolean = false): Record<string, string> => {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('token') 
    : null;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('⚠️ No authentication token found in localStorage');
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

const buildApiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl(); // ✅ هر بار تازه محاسبه می‌شه
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${base}/${cleanEndpoint}`;
};

export { API_BASE_URL, getApiBaseUrl, getApiBaseUrlClient, getAuthHeaders, buildApiUrl };