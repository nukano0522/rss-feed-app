import axios from 'axios';
import config from '../config';
import { Feed, Article, RssFeedResponse, FavoriteArticleRequest } from '../types';
const api = axios.create({
  baseURL: config.apiUrl,
  // baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

interface ApiResponse<T> {
  data: T;
}

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

export const feedsApi = {
  getFeeds: () => api.get<Feed[]>('/feeds'),
  createFeed: (feed: Omit<Feed, 'id'>) => api.post<Feed>('/feeds', feed),
  updateFeed: (id: number, feed: Partial<Feed>) => api.put<Feed>(`/feeds/${id}`, feed),
  deleteFeed: (id: number) => api.delete(`/feeds/${id}`),
  parseFeed: (url: string) => api.get<RssFeedResponse>(`/feeds/parse-feed?url=${encodeURIComponent(url)}`),
  readArticle: (articleLink: string) => api.post('/feeds/read-articles', { article_link: articleLink }),
  getReadArticles: () => api.get('/feeds/read-articles'),
  getFavoriteArticles: () => api.get('/feeds/favorite-articles'),
  addFavoriteArticle: (article: Article) => api.post('/feeds/favorite-articles', {
    article_link: article.link,
    article_title: article.title,
    article_description: article.description || '',
    article_image: article.image || '',
    article_categories: article.categories || [],
    feed_id: article.feed_id
    } as FavoriteArticleRequest),
  removeFavoriteArticle: (articleLink: string) => api.delete(`/feeds/favorite-articles/${btoa(articleLink)}`),
  summarizeArticle: (article: Article, feedId: number) => api.post('/feeds/articles/summarize', {
    article_link: article.link,
    feed_id: feedId
  }),
};

export default api; 