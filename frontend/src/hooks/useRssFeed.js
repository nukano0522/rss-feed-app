import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

import { MOCK_ARTICLES } from '../mocks/feedData';

export const useRssFeed = () => {
  const [feeds, setFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [readArticles, setReadArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const api = axios.create({
    baseURL: config.apiUrl,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // フィードの取得
  const fetchFeeds = async () => {
    try {
      const response = await api.get('/feeds');
      setFeeds(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching feeds:', error);
      return [];
    }
  };

  // 記事の取得
  const fetchArticles = async (feeds) => {
    try {
      setIsLoading(true);
      const enabledFeeds = feeds.filter(feed => feed.enabled);
      
      const fetchedArticles = [];
      for (const feed of enabledFeeds) {
        try {
          console.log(`Fetching feed: ${feed.url}`);
          
          try {
            const response = await api.get(`/parse-feed`, {
              params: { url: feed.url },
              timeout: 10000
            });
            
            // 429エラーの場合、モックデータを使用
            if (response.data.status === "error" && response.data.code === 429) {
              console.log(`Using mock data for ${feed.url} due to rate limit`);
              const mockArticles = MOCK_ARTICLES[feed.url] || [];
              fetchedArticles.push(...mockArticles);
            } else if (response.data && response.data.entries) {
              const feedArticles = response.data.entries.map(article => ({
                ...article,
                feedName: feed.name || feed.url,
                feedUrl: feed.url
              }));
              fetchedArticles.push(...feedArticles);
            }
          } catch (error) {
            console.error(`Error fetching articles from ${feed.url}:`, error);
            console.error('Error response:', {
              status: error.response?.status,
              data: error.response?.data
            });
            continue;
          }
        } catch (error) {
          console.error(`Unexpected error for ${feed.url}:`, error);
          continue;
        }
      }

      if (fetchedArticles.length > 0) {
        const sortedArticles = fetchedArticles.sort((a, b) => 
          new Date(b.published) - new Date(a.published)
        );
        setArticles(sortedArticles);
      } else {
        console.warn('No articles fetched from any feed');
        setArticles([]);
      }
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
  const handleAddFeed = async (newFeed) => {
    try {
      const response = await api.post('/feeds', {
        url: newFeed.url,
        name: newFeed.name,
        enabled: newFeed.enabled,
        default_image: newFeed.default_image
      });
      setFeeds(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding feed:', error);
      throw error;
    }
  };

  // フィードの編集
  const handleEditFeed = async (feedId, updatedFeed) => {
    try {
      if (!feedId) {
        throw new Error('Feed ID is required');
      }

      if (!updatedFeed || !updatedFeed.url || !updatedFeed.name) {
        throw new Error('Invalid feed data');
      }

      console.log('Updating feed:', {
        feedId,
        updatedData: updatedFeed
      });

      const feedData = {
        url: updatedFeed.url,
        name: updatedFeed.name,
        enabled: updatedFeed.enabled !== undefined ? updatedFeed.enabled : true,
        default_image: updatedFeed.default_image
      };

      // APIリクエスト
      const response = await api.put(`/feeds/${feedId}`, feedData);
      
      // フィード一覧の更新
      setFeeds(prev => prev.map(feed => 
        feed.id === feedId ? response.data : feed
      ));

      return response.data;
    } catch (error) {
      console.error('Error updating feed:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  };

  // フィードの有効/無効切り替え
  const handleToggleFeed = async (feedId) => {
    try {
      const feed = feeds.find(f => f.id === feedId);
      if (!feed) {
        throw new Error('Feed not found');
      }

      const updatedFeed = { 
        ...feed,
        enabled: !feed.enabled 
      };

      const response = await api.put(`/feeds/${feedId}`, updatedFeed);
      
      setFeeds(prev => prev.map(f => 
        f.id === feedId ? response.data : f
      ));

      return response.data;
    } catch (error) {
      console.error('Error toggling feed:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  };

  // フィードの削除
  const handleDeleteFeed = async (feedId) => {
    try {
      if (!feedId) {
        throw new Error('Feed ID is required');
      }

      await api.delete(`/feeds/${feedId}`);
      setFeeds(prev => prev.filter(feed => feed.id !== feedId));
    } catch (error) {
      console.error('Error deleting feed:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  };

  // 記事を既読にする
  const markAsRead = async (articleLink) => {
    try {
      await api.post('/read-articles', { article_link: articleLink });
      setReadArticles(prev => [...prev, articleLink]);
    } catch (error) {
      console.error('Error marking article as read:', error);
      throw error;
    }
  };

  return {
    feeds,
    articles,
    readArticles,
    isLoading,
    handleAddFeed,
    handleEditFeed,
    handleToggleFeed,
    handleDeleteFeed,
    markAsRead,
  };
}; 