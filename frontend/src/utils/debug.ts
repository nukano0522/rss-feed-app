/// <reference types="vite/client" />

export const debugEnvironment = () => {
  console.log('Current Environment:', {
    MODE: import.meta.env.MODE,
    BASE_URL: import.meta.env.BASE_URL,
    VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_STORAGE_TYPE: import.meta.env.VITE_STORAGE_TYPE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  });
};

export const debugApiRequest = (config: any) => {
  if (import.meta.env.DEV) {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
    });
  }
};

export const debugApiResponse = (response: any) => {
  if (import.meta.env.DEV) {
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });
  }
};

export const debugApiError = (error: any) => {
  if (import.meta.env.DEV) {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
  }
}; 