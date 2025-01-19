import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import FeedManager from './components/FeedManager';
import ArticleList from './components/ArticleList';
import Navigation from './components/Navigation';
import { useState } from 'react';

function App() {
  const [selectedMenu, setSelectedMenu] = useState(() => {
    const savedMenu = localStorage.getItem('selectedMenu');
    return savedMenu || 'feeds';
  });

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    localStorage.setItem('selectedMenu', menu);
    console.log('Selected menu:', menu);
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
          <FeedManager />
        ) : (
          <ArticleList />
        )}
      </Box>
    </Box>
  );
}

export default App;
