import { useState, useEffect } from 'react';
import axios from 'axios';
import { extractImage } from '../utils/imageUtils';

export const useRssFeed = () => {
  const [feeds, setFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [readArticles, setReadArticles] = useState(() => {
    try {
      const saved = localStorage.getItem('readArticles');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading read articles:', error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // 既読状態をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('readArticles', JSON.stringify(readArticles));
  }, [readArticles]);

  // 記事を既読にする関数
  const markAsRead = (articleLink) => {
    if (!readArticles.includes(articleLink)) {
      setReadArticles(prev => [...prev, articleLink]);
    }
  };

  // フィードの初期化
  useEffect(() => {
    const loadFeeds = () => {
      try {
        const savedFeeds = localStorage.getItem('rssFeeds');
        if (savedFeeds) {
          const parsedFeeds = JSON.parse(savedFeeds);
          setFeeds(parsedFeeds.map(feed => ({
            ...feed,
            defaultImage: feed.defaultImage || null
          })));
        }
      } catch (error) {
        console.error('Error loading feeds:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeeds();
  }, []);

  // フィードが変更されたら記事を取得
  useEffect(() => {
    const fetchAllFeeds = async () => {
      if (isLoading) return;

      const enabledFeeds = feeds.filter(feed => feed.enabled);
      const allArticles = [];

      for (const feed of enabledFeeds) {
        try {
          const articles = await fetchRssFeed(feed.url, feed);
          allArticles.push(...articles);
        } catch (error) {
          console.error(`Error fetching feed ${feed.name}:`, error);
        }
      }

      const sortedArticles = allArticles.sort((a, b) => {
        return new Date(b.pubDate) - new Date(a.pubDate);
      });

      setArticles(sortedArticles);
    };

    fetchAllFeeds();
  }, [feeds, isLoading]);

  // フィードの取得
  const fetchRssFeed = async (url, feed) => {
    try {
      const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      const response = await axios.get(API_URL);

      if (response.data.status !== 'ok') {
        console.warn(`Feed fetch warning for ${url}:`, response.data.message);
        return [];
      }

      return response.data.items.map(item => {
        try {
          const imageUrl = extractImage(item, feed);
          return {
            ...item,
            thumbnail: imageUrl,
            sourceName: feed?.name
          };
        } catch (error) {
          console.warn(`Image extraction error for item in ${url}:`, error);
          return {
            ...item,
            thumbnail: feed?.defaultImage || 'data:image/svg+xml,...',
            sourceName: feed?.name
          };
        }
      });
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      return [];
    }
  };

  // フィード管理関連の関数
  const handleAddFeed = (newFeed) => {
    const updatedFeeds = [...feeds, { ...newFeed, enabled: true }];
    setFeeds(updatedFeeds);
    localStorage.setItem('rssFeeds', JSON.stringify(updatedFeeds));
  };

  const handleEditFeed = (index, updatedFeed) => {
    const updatedFeeds = feeds.map((feed, i) => {
      if (i === index) {
        return {
          ...feed,
          name: updatedFeed.name,
          url: updatedFeed.url,
          defaultImage: updatedFeed.defaultImage || null,
          enabled: feed.enabled
        };
      }
      return feed;
    });
    setFeeds(updatedFeeds);
    localStorage.setItem('rssFeeds', JSON.stringify(updatedFeeds));
  };

  const handleToggleFeed = (index) => {
    const updatedFeeds = feeds.map((feed, i) => {
      if (i === index) {
        return { ...feed, enabled: !feed.enabled };
      }
      return feed;
    });
    setFeeds(updatedFeeds);
    localStorage.setItem('rssFeeds', JSON.stringify(updatedFeeds));
  };

  const handleDeleteFeed = (index) => {
    const updatedFeeds = feeds.filter((_, i) => i !== index);
    setFeeds(updatedFeeds);
    localStorage.setItem('rssFeeds', JSON.stringify(updatedFeeds));
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