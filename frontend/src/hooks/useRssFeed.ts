import { useState, useEffect } from 'react';
import api, { feedsApi } from '../services/api';

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

interface UseRssFeedReturn {
  feeds: Feed[];
  articles: Article[];
  isLoading: boolean;
  handleAddFeed: (newFeed: Omit<Feed, 'id'>) => Promise<Feed>;
  handleEditFeed: (feedId: number, updatedFeed: Partial<Feed>) => Promise<Feed>;
  handleDeleteFeed: (feedId: number) => Promise<void>;
  handleToggleFeed: (feedId: number) => Promise<void>;
  fetchArticles: (feeds: Feed[]) => Promise<void>;
}

export const useRssFeed = (): UseRssFeedReturn => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchFeeds = async (): Promise<Feed[]> => {
    try {
      const response = await api.get<Feed[]>('/feeds');
      setFeeds(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching feeds:', error);
      return [];
    }
  };

  const fetchArticles = async (feeds: Feed[]): Promise<void> => {
    try {
      setIsLoading(true);
      const enabledFeeds = feeds.filter(feed => feed.enabled);
      const response = await api.post<Article[]>('/feeds/fetch-articles', {
        feeds: enabledFeeds
      });
      setArticles(response.data);
    } catch (error) {
      console.error('Error in fetchArticles:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 初期データの取得
  useEffect(() => {
    const initializeData = async () => {
      const feeds = await fetchFeeds();
      if (feeds.length > 0) {
        await fetchArticles(feeds);
      }
      setIsLoading(false);
    };

    initializeData();
  }, []);

  // フィードが変更されたら記事を再取得
  useEffect(() => {
    if (feeds.length > 0) {
      fetchArticles(feeds);
    }
  }, [feeds]);

  // フィードの追加
  const handleAddFeed = async (newFeed: Omit<Feed, 'id'>): Promise<Feed> => {
    try {
      const response = await api.post<Feed>('/feeds', newFeed);
      setFeeds(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding feed:', error);
      throw error;
    }
  };

  // フィードの編集
  const handleEditFeed = async (feedId: number, updatedFeed: Partial<Feed>): Promise<Feed> => {
    try {
      const response = await api.put<Feed>(`/feeds/${feedId}`, updatedFeed);
      setFeeds(prev => prev.map(feed => 
        feed.id === feedId ? response.data : feed
      ));
      return response.data;
    } catch (error) {
      console.error('Error updating feed:', error);
      throw error;
    }
  };

  // フィードの削除
  const handleDeleteFeed = async (feedId: number): Promise<void> => {
    try {
      await api.delete(`/feeds/${feedId}`);
      setFeeds(prev => prev.filter(feed => feed.id !== feedId));
    } catch (error) {
      console.error('Error deleting feed:', error);
      throw error;
    }
  };

  // フィードの有効/無効切り替え
  const handleToggleFeed = async (feedId: number): Promise<void> => {
    const feed = feeds.find(f => f.id === feedId);
    if (feed) {
      await handleEditFeed(feedId, { enabled: !feed.enabled });
    }
  };

  return {
    feeds,
    articles,
    isLoading,
    handleAddFeed,
    handleEditFeed,
    handleDeleteFeed,
    handleToggleFeed,
    fetchArticles
  };
}; 