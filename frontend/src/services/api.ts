import axios from 'axios';
import config from '../config';

interface Feed {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
  default_image: string | null;
}

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  feedUrl: string;
  image?: string;
  categories?: string[];
}

const api = axios.create({
  baseURL: `${config.apiUrl}`,
  headers: {
    'Content-Type': 'application/json',
  }
});

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

// feedsApiの型定義
interface FeedApiResponse<T> {
  data: T;
  status: number;
}

export const feedsApi = {
  getFeeds: () => api.get<FeedApiResponse<Feed[]>>('/feeds'),
  createFeed: (feed: Omit<Feed, 'id'>) => 
    api.post<FeedApiResponse<Feed>>('/feeds', feed),
  updateFeed: (id: number, feed: Partial<Feed>) => 
    api.put<FeedApiResponse<Feed>>(`/feeds/${id}`, feed),
  deleteFeed: (id: number) => 
    api.delete(`/feeds/${id}`),
  readArticle: (articleLink: string) => 
    api.post('/feeds/read-articles', { article_link: articleLink }),
  parseFeed: (url: string) => 
    api.get(`/feeds/parse-feed?url=${url}`),
  getFavoriteArticles: () => 
    api.get('/feeds/favorite-articles'),
  checkFavoriteArticles: () => 
    api.get('/feeds/favorite-articles/check'),
  addFavoriteArticle: (article: Article) => 
    api.post('/feeds/favorite-articles', {
      article_link: article.link,
      article_title: article.title,
      article_description: article.description || '',
      article_image: article.image || '',
      article_categories: article.categories || []
    }),
  removeFavoriteArticle: (articleLink: string) => {
    const encodedLink = btoa(articleLink);
    return api.delete(`/feeds/favorite-articles/${encodedLink}`);
  },
};

export default api; 