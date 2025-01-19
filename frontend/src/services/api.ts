import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  }
});

// レスポンスのインターセプター追加
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// APIのレスポンス型定義
interface Feed {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
  default_image?: string;
  created_at: string;
}

interface ReadArticle {
  id: number;
  article_link: string;
  read_at: string;
}

// APIメソッドの型定義
export const feedsApi = {
  getFeeds: () => api.get<Feed[]>('/feeds'),
  createFeed: (feed: Omit<Feed, 'id' | 'created_at'>) => {
    console.log('Creating feed:', feed); // デバッグ用
    return api.post<Feed>('/feeds', feed);
  },
  updateFeed: (id: number, feed: Partial<Feed>) => 
    api.put<Feed>(`/feeds/${id}`, feed),
  deleteFeed: (id: number) => 
    api.delete(`/feeds/${id}`),
  markAsRead: (articleLink: string) => 
    api.post<ReadArticle>('/read-articles', { article_link: articleLink }),
}; 