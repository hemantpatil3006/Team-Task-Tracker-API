const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  options: FetchOptions;
  endpoint: string;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      if (!prom.options.headers) prom.options.headers = {};
      (prom.options.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      fetchApi(prom.endpoint, prom.options)
        .then((res) => prom.resolve(res))
        .catch((err) => prom.reject(err));
    }
  });
  failedQueue = [];
};

export async function fetchApi(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  if (!options.headers) {
    options.headers = {};
  }

  // Set default JSON headers
  if (!(options.body instanceof FormData) && !options.headers['Content-Type' as keyof typeof options.headers]) {
    (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  // Attach access token
  if (!options.skipAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      (options.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, options);

    // If unauthorized, attempt token rotation
    if (response.status === 401 && !options.skipAuth && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, clear credentials and redirect to login
        logoutLocal();
        throw new Error('Unauthorized');
      }

      if (isRefreshing) {
        // Queue this request and wait for the refresh to finish
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, options, endpoint });
        });
      }

      isRefreshing = true;

      try {
        // Call backend refresh token rotation endpoint
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Session expired');
        }

        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.data.tokens.accessToken;
        const newRefreshToken = refreshData.data.tokens.refreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        isRefreshing = false;
        
        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry the current request
        (options.headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
        return await fetchApi(endpoint, options);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        logoutLocal();
        window.location.href = '/login';
        throw refreshError;
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `HTTP error! status: ${response.status}`;
      const error: any = new Error(errorMsg);
      error.status = response.status;
      error.code = data?.code;
      error.details = data?.details;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

function logoutLocal() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}
