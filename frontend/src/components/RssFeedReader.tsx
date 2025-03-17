import React, { useState, useEffect } from 'react';
import FeedManager from './FeedManager';
import ArticleList from './ArticleList';
import FavoritesTab from './FavoritesTab';
import Navigation from './Navigation';
import { useRssFeed } from '../hooks/useRssFeed';
import { MenuType } from '../types';

const RssFeedReader: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<MenuType>(() => {
    const savedMenu = localStorage.getItem('selectedMenu') as MenuType;
    return savedMenu || 'articles';
  });
  const [isMobile, setIsMobile] = useState(false);

  // 画面サイズの検出
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const {
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
    favoriteArticlesList,
    toggleFavorite,
  } = useRssFeed();

  const handleMenuSelect = (menu: MenuType): void => {
    setSelectedMenu(menu);
    localStorage.setItem('selectedMenu', menu);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <Navigation 
        selectedMenu={selectedMenu} 
        onMenuSelect={handleMenuSelect}
      />
      <main className={`flex-1 p-2 sm:p-4 md:p-6 ${isMobile ? 'pt-[70px]' : ''}`}>
        <div className="max-w-[1200px] mx-auto">
          {selectedMenu === 'feeds' ? (
            <FeedManager 
              feeds={feeds}
              onAddFeed={handleAddFeed}
              onToggleFeed={handleToggleFeed}
              onDeleteFeed={handleDeleteFeed}
              onEditFeed={handleEditFeed}
            />
          ) : selectedMenu === 'favorites' ? (
            <FavoritesTab 
              articles={favoriteArticlesList}
              readArticles={readArticles}
              feeds={feeds}
              isLoading={isLoading}
              onArticleRead={readArticle}
              favoriteArticles={favoriteArticles}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <ArticleList 
              articles={articles}
              readArticles={readArticles}
              feeds={feeds}
              isLoading={isLoading}
              onArticleRead={readArticle}
              favoriteArticles={favoriteArticles}
              onToggleFavorite={toggleFavorite}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default RssFeedReader; 