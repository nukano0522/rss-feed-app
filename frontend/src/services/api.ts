import axios from 'axios';
import { Feed, Article, RssFeedResponse, FavoriteArticleRequest } from '../types';
import { debugEnvironment, debugApiRequest, debugApiResponse, debugApiError } from '../utils/debug';

// 開発環境の場合のみデバッグ情報を表示
if (import.meta.env.MODE === 'development' && import.meta.env.DEV) {
  debugEnvironment();
}

// プロトコルに応じてベースURLを設定
const getBaseUrl = () => {
  // developmentの場合はlocalhost:8000, productionの場合は/api/v1
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:8000/api/v1';
  }
  // TO-DO ecsの場合は/api/v1, lambdaの場合はimport.meta.env.VITE_API_BASE_URL
  // return '/api/v1';
  return import.meta.env.VITE_API_BASE_URL;
};
const baseURL = getBaseUrl();

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// リクエストのインターセプター
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.PROD && config.url && !config.url.startsWith('https://')) {
      config.url = config.url.replace(/^http:/, 'https:');
    }
    debugApiRequest(config);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    debugApiError(error);
    return Promise.reject(error);
  }
);

// レスポンスのインターセプター
api.interceptors.response.use(
  response => {
    debugApiResponse(response);
    return response;
  },
  error => {
    debugApiError(error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
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
    feed_id: article.feedUrl === 'external://articles' ? null : article.feed_id,
    is_external: article.feedUrl === 'external://articles'
    } as FavoriteArticleRequest),
  removeFavoriteArticle: (articleLink: string) => api.delete(`/feeds/favorite-articles/${btoa(articleLink)}`),
  summarizeArticle: (article: Article, feedId: number) => api.post('/feeds/articles/summarize', {
    article_link: article.link,
    feed_id: feedId
  }),
  extractMetadata: (url: string) => api.get(`/feeds/extract-metadata?url=${encodeURIComponent(url)}`),
};

export default api; 