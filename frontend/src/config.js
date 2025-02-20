const config = {
  apiUrl: import.meta.env.VITE_API_URL || '/api/v1',
  baseUrl: import.meta.env.VITE_BASE_URL,
  storageType: import.meta.env.VITE_STORAGE_TYPE
};

export default config;