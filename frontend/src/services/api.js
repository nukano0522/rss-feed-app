import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  }
});

// リクエストインターセプターを追加
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスのインターセプター
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// APIメソッドの定義
export const feedsApi = {
  getFeeds: () => api.get('/feeds'),
  createFeed: (feed) => {
    // console.log('Creating feed:', feed); // デバッグ用
    return api.post('/feeds', feed);
  },
  updateFeed: (id, feed) => 
    api.put(`/feeds/${id}`, feed),
  deleteFeed: (id) => 
    api.delete(`/feeds/${id}`),
  markAsRead: (articleLink) => 
    api.post('/read-articles', { article_link: articleLink }),
  parseFeed: (url) => 
    api.get(`/feeds/parse-feed?url=${url}`),
}; 