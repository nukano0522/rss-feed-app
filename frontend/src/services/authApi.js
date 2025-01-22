import axios from 'axios';
import config from '../config';

const authApi = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  try {
    const response = await authApi.post('/auth/jwt/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const register = async (email, password) => {
  try {
    const response = await authApi.post('/auth/register', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
}; 