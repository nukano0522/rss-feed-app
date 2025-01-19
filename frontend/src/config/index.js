const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  storageType: import.meta.env.VITE_STORAGE_TYPE || 'api',
  isDevelopment: import.meta.env.MODE === 'development'
};

export default config; 