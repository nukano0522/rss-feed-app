import React, { useState, useEffect, useMemo } from 'react';
import { Box, CssBaseline } from '@mui/material';
import FeedManager from './FeedManager';
import ArticleList from './ArticleList';
import Navigation from './Navigation';
// import { useRssFeed } from '../hooks/useRssFeed';
import { useRssFeed } from '../hooks/useRssFeed.ts';

const RssFeedReader = () => {
  const [selectedMenu, setSelectedMenu] = useState(() => {
    const savedMenu = localStorage.getItem('selectedMenu');
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

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    localStorage.setItem('selectedMenu', menu);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Navigation 
        selectedMenu={selectedMenu} 
        onMenuSelect={handleMenuSelect}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
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
      </Box>
    </Box>
  );
};

export default RssFeedReader; 