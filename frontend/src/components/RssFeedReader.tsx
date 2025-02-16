import React, { useState } from 'react';
import FeedManager from './FeedManager';
import ArticleList from './ArticleList';
import Navigation from './Navigation';
import { useRssFeed } from '../hooks/useRssFeed';
import { MenuType } from '../types';

const RssFeedReader: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<MenuType>(() => {
    const savedMenu = localStorage.getItem('selectedMenu') as MenuType;
    return savedMenu || 'articles';
  });

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
    <div className="flex min-h-screen bg-background">
      <Navigation 
        selectedMenu={selectedMenu} 
        onMenuSelect={handleMenuSelect}
      />
      <main className="flex-1 p-6">
        {selectedMenu === 'feeds' ? (
          <FeedManager 
            feeds={feeds}
            onAddFeed={handleAddFeed}
            onToggleFeed={handleToggleFeed}
            onDeleteFeed={handleDeleteFeed}
            onEditFeed={handleEditFeed}
          />
        ) : selectedMenu === 'favorites' ? (
          <ArticleList 
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
      </main>
    </div>
  );
};

export default RssFeedReader; 