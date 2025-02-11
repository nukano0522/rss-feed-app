import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput, Chip } from '@mui/material';
import FeedManager from './FeedManager';
import ArticleList from './ArticleList';
import Navigation from './Navigation';
import { useRssFeed } from '../hooks/useRssFeed';

const RssFeedReader = () => {
  const [selectedMenu, setSelectedMenu] = useState(() => {
    const savedMenu = localStorage.getItem('selectedMenu');
    return savedMenu || 'feeds';
  });

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    localStorage.setItem('selectedMenu', menu);
  };

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
  } = useRssFeed();

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
        ) : (
          <ArticleList 
            articles={articles}
            readArticles={readArticles}
            feeds={feeds}
            isLoading={isLoading}
            onArticleRead={readArticle}
          />
        )}
      </Box>
    </Box>
  );
};

export default RssFeedReader; 