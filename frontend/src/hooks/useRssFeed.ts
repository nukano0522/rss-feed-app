import { useState, useEffect } from 'react';
import { feedsApi, RssEntry } from '../services/api';

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
  published: string;
  feedUrl: string;
  feedName: string;
  image?: string;
  categories?: string[];
}

interface FavoriteArticleData {
  article_title: string;
  article_link: string;
  article_description: string | null;
  article_image: string | null;
  article_categories: string[];
  favorited_at: string;
}

interface UseRssFeedReturn {
  feeds: Feed[];
  articles: Article[];
  readArticles: string[];
  isLoading: boolean;
  favoriteArticles: string[];
  favoriteArticlesList: Article[];
  handleAddFeed: (newFeed: Omit<Feed, 'id'>) => Promise<Feed>;
  handleEditFeed: (feedId: number, updatedFeed: Partial<Feed>) => Promise<Feed>;
  handleDeleteFeed: (feedId: number) => Promise<void>;
  handleToggleFeed: (feedId: number) => Promise<void>;
  readArticle: (articleLink: string) => Promise<void>;
  toggleFavorite: (article: Article) => Promise<void>;
  fetchArticles: (feeds: Feed[]) => Promise<void>;
}

export const useRssFeed = (): UseRssFeedReturn => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [readArticles, setReadArticles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [favoriteArticles, setFavoriteArticles] = useState<string[]>([]);
  const [favoriteArticlesList, setFavoriteArticlesList] = useState<Article[]>([]);

  const fetchFeeds = async (): Promise<Feed[]> => {
    try {
      const { data } = await feedsApi.getFeeds();
      setFeeds(data);
      return data;
    } catch (error) {
      console.error('Error fetching feeds:', error);
      return [];
    }
  };

  const fetchArticles = async (feeds: Feed[]): Promise<void> => {
    try {
      setIsLoading(true);
      const enabledFeeds = feeds.filter(feed => feed.enabled);
      
      const fetchedArticles = [];
      for (const feed of enabledFeeds) {
        try {
          console.log(`Fetching feed: ${feed.url}`);
          const response = await feedsApi.parseFeed(feed.url);
          
          if (response.data && response.data.entries) {
            const feedArticles = response.data.entries.map((article: RssEntry) => ({
              ...article,
              feedName: feed.name || feed.url,
              feedUrl: feed.url
            }));
            fetchedArticles.push(...feedArticles);
          }
        } catch (error) {
          console.error(`Error fetching articles from ${feed.url}:`, error);
          continue;
        }
      }

      if (fetchedArticles.length > 0) {
        const sortedArticles = fetchedArticles.sort((a, b) => 
          new Date(b.published).getTime() - new Date(a.published).getTime()
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
  const handleAddFeed = async (newFeed: Omit<Feed, 'id'>): Promise<Feed> => {
    try {
      const response = await feedsApi.createFeed(newFeed);
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

  // フィードの削除
  const handleDeleteFeed = async (feedId: number): Promise<void> => {
    try {
      await feedsApi.deleteFeed(feedId);
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

  // 記事を既読にする
  const readArticle = async (articleLink: string): Promise<void> => {
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
        const favoriteArticlesData: FavoriteArticleData[] = response.data;
        
        // お気に入り記事のリンク一覧を更新
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
          feedName: 'お気に入り',
          feedUrl: ''
        })));
      } catch (error) {
        console.error('Error fetching favorite articles:', error);
      }
    };

    fetchFavoriteArticles();
  }, []);

  // お気に入り登録・解除の処理
  const toggleFavorite = async (article: Article): Promise<void> => {
    try {
      if (favoriteArticles.includes(article.link)) {
        // お気に入り解除
        await feedsApi.removeFavoriteArticle(article.link);
        setFavoriteArticles(prev => prev.filter(link => link !== article.link));
        setFavoriteArticlesList(prev => prev.filter(a => a.link !== article.link));
      } else {
        // お気に入り登録
        await feedsApi.addFavoriteArticle(article);
        setFavoriteArticles(prev => [...prev, article.link]);
        setFavoriteArticlesList(prev => [...prev, {
          title: article.title,
          link: article.link,
          description: article.description || '',
          image: article.image || '',
          categories: article.categories || [],
          published: new Date().toISOString(),
          feedName: 'お気に入り',
          feedUrl: ''
        }]);
      }

      // お気に入り記事の一覧を再取得して最新の状態に更新
      const response = await feedsApi.getFavoriteArticles();
      const favoriteArticlesData: FavoriteArticleData[] = response.data;
      
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
        feedName: 'お気に入り',
        feedUrl: ''
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
    favoriteArticles,
    favoriteArticlesList,
    handleAddFeed,
    handleEditFeed,
    handleDeleteFeed,
    handleToggleFeed,
    readArticle,
    toggleFavorite,
    fetchArticles
  };
}; 