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