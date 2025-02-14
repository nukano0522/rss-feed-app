import { useState, useEffect } from 'react';
import { feedsApi } from '../services/api';

import { MOCK_ARTICLES } from '../mocks/feedData';

export const useRssFeed = () => {
  const [feeds, setFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [readArticles, setReadArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteArticles, setFavoriteArticles] = useState([]);
  const [favoriteArticlesList, setFavoriteArticlesList] = useState([]);

  // フィードの取得
  const fetchFeeds = async () => {
    try {
      const response = await feedsApi.getFeeds();
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
            const response = await feedsApi.parseFeed(feed.url);
            
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
      const response = await feedsApi.createFeed({
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
      const response = await feedsApi.updateFeed(feedId, updatedFeed);
      setFeeds(prev => prev.map(feed => 
        feed.id === feedId ? response.data : feed
      ));
      return response.data;
    } catch (error) {
      console.error('Error updating feed:', error);
      throw error;
    }
  };

  // フィードの有効/無効切り替え
  const handleToggleFeed = async (feedId) => {
    const feed = feeds.find(f => f.id === feedId);
    if (feed) {
      await handleEditFeed(feedId, { enabled: !feed.enabled });
    }
  };

  // フィードの削除
  const handleDeleteFeed = async (feedId) => {
    try {
      await feedsApi.deleteFeed(feedId);
      setFeeds(prev => prev.filter(feed => feed.id !== feedId));
    } catch (error) {
      console.error('Error deleting feed:', error);
      throw error;
    }
  };

  // 記事を既読にする
  const readArticle = async (articleLink) => {
    try {
      await feedsApi.readArticle(articleLink);
      setReadArticles(prev => [...prev, articleLink]);
    } catch (error) {
      console.error('Error marking article as read:', error);
      throw error;
    }
  };

  // お気に入り記事の取得
  useEffect(() => {
    const fetchFavoriteArticles = async () => {
      try {
        // 完全な記事データを取得
        const response = await feedsApi.getFavoriteArticles();
        const favoriteArticlesData = response.data;
        
        // お気に入り記事のリンク一覧も更新
        const favoriteLinks = favoriteArticlesData.map(article => article.article_link);
        setFavoriteArticles(favoriteLinks);
        
        // お気に入り記事の完全なデータを保持
        setFavoriteArticlesList(favoriteArticlesData.map(article => ({
          title: article.article_title,
          link: article.article_link,
          description: article.article_description || '',
          image: article.article_image || '',
          categories: article.article_categories || [],
          published: article.favorited_at,
          feedName: 'お気に入り', // または適切な値
        })));
      } catch (error) {
        console.error('Error fetching favorite articles:', error);
      }
    };

    fetchFavoriteArticles();
  }, []);

  // お気に入り登録・解除の処理
  const toggleFavorite = async (article) => {
    try {

      if (favoriteArticles.includes(article.link)) {
        await feedsApi.removeFavoriteArticle(article.link);
        setFavoriteArticles(prev => prev.filter(link => link !== article.link));
        setFavoriteArticlesList(prev => prev.filter(a => a.link !== article.link));
      } else {
        await feedsApi.addFavoriteArticle({
          link: article.link,
          title: article.title,
          description: article.description || '',
          image: article.image || '',
          categories: article.categories || []
        });
        setFavoriteArticles(prev => [...prev, article.link]);
        setFavoriteArticlesList(prev => [...prev, {
          title: article.title,
          link: article.link,
          description: article.description || '',
          image: article.image || '',
          categories: article.categories || [],
          published: new Date().toISOString(),
          feedName: 'お気に入り'
        }]);
      }

      // お気に入り記事の一覧を再取得
      const response = await feedsApi.getFavoriteArticles();
      const favoriteArticlesData = response.data;
      
      // お気に入り記事のリンク一覧を更新
      setFavoriteArticles(favoriteArticlesData.map(article => article.article_link));
      
      // お気に入り記事の完全なデータを更新
      setFavoriteArticlesList(favoriteArticlesData.map(article => ({
        title: article.article_title,
        link: article.article_link,
        description: article.article_description || '',
        image: article.article_image || '',
        categories: article.article_categories || [],
        published: article.favorited_at,
        feedName: 'お気に入り'
      })));

    } catch (error) {
      console.error('Failed to toggle favorite:', error);
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
    readArticle,
    favoriteArticles,
    toggleFavorite,
    favoriteArticlesList,
  };
}; 