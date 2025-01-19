import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Badge,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ArticleList = ({ articles, readArticles, feeds, isLoading, onArticleRead }) => {
  // 初期化時にローカルストレージから状態を復元
  const [selectedFeeds, setSelectedFeeds] = useState(() => {
    // フィードのロード完了を待ってから初期化
    if (!isLoading && feeds.length > 0) {
      try {
        const savedFeeds = localStorage.getItem('selectedFeeds');
        if (savedFeeds) {
          const parsed = JSON.parse(savedFeeds);
          const enabledFeeds = feeds.filter(feed => feed.enabled).map(feed => feed.name);
          return parsed.filter(name => enabledFeeds.includes(name));
        }
      } catch (error) {
        console.error('Error loading saved feeds:', error);
      }
    }
    return feeds.filter(feed => feed.enabled).map(feed => feed.name);
  });

  // 選択状態が変更されたらローカルストレージに保存
  const saveSelectedFeeds = (feeds) => {
    try {
      localStorage.setItem('selectedFeeds', JSON.stringify(feeds));
    } catch (error) {
      console.error('Error saving selected feeds:', error);
    }
  };

  // フィードの選択状態を切り替え
  const handleFeedToggle = (feedName) => {
    setSelectedFeeds(prev => {
      const newSelected = prev.includes(feedName)
        ? prev.filter(name => name !== feedName)
        : [...prev, feedName];
      saveSelectedFeeds(newSelected);
      return newSelected;
    });
  };

  // 全選択/全解除の切り替え
  const handleSelectAll = (event) => {
    const enabledFeeds = feeds.filter(feed => feed.enabled).map(feed => feed.name);
    const newSelected = event.target.checked ? enabledFeeds : [];
    setSelectedFeeds(newSelected);
    saveSelectedFeeds(newSelected);
  };

  // フィードの有効状態が変更されたときに選択状態を更新
  useEffect(() => {
    if (!isLoading && feeds.length > 0) {
      const savedFeeds = localStorage.getItem('selectedFeeds');
      if (savedFeeds) {
        try {
          const parsed = JSON.parse(savedFeeds);
          const enabledFeeds = feeds.filter(feed => feed.enabled).map(feed => feed.name);
          const validFeeds = parsed.filter(name => enabledFeeds.includes(name));
          setSelectedFeeds(validFeeds);
        } catch (error) {
          console.error('Error loading saved feeds:', error);
          setSelectedFeeds(feeds.filter(feed => feed.enabled).map(feed => feed.name));
        }
      }
    }
  }, [isLoading, feeds]);

  const handleArticleClick = (article) => {
    onArticleRead(article.link);
    window.open(article.link, '_blank', 'noopener,noreferrer');
  };

  // フィルタリングされた記事
  const filteredArticles = articles.filter(article => 
    selectedFeeds.includes(article.sourceName)
  );

  return (
    <Box>
      {/* フィードフィルター */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          フィルター
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={
                  selectedFeeds.length > 0 &&
                  selectedFeeds.length === feeds.filter(feed => feed.enabled).length
                }
                indeterminate={
                  selectedFeeds.length > 0 && 
                  selectedFeeds.length < feeds.filter(feed => feed.enabled).length
                }
                onChange={handleSelectAll}
              />
            }
            label="すべて選択/解除"
          />
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2,
            mt: 1
          }}>
            {feeds
              .filter(feed => feed.enabled)
              .map((feed) => (
                <FormControlLabel
                  key={feed.name}
                  control={
                    <Checkbox
                      checked={selectedFeeds.includes(feed.name)}
                      onChange={() => handleFeedToggle(feed.name)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {feed.defaultImage && (
                        <img 
                          src={feed.defaultImage} 
                          alt={feed.name}
                          style={{ width: 20, height: 20 }}
                        />
                      )}
                      {feed.name}
                    </Box>
                  }
                />
              ))}
          </Box>
        </FormGroup>
      </Paper>

      {/* 記事一覧 */}
      <Grid container spacing={2}>
        {filteredArticles.map((article, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Box sx={{ position: 'relative' }}>
              {/* 既読マーク */}
              {readArticles.includes(article.link) && (
                <CheckCircleIcon
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    color: 'success.main',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    zIndex: 1,
                    fontSize: 24,
                  }}
                />
              )}
              
              <Card 
                sx={{ 
                  display: 'flex',
                  height: '140px',
                  opacity: readArticles.includes(article.link) ? 0.7 : 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    opacity: readArticles.includes(article.link) ? 0.8 : 1,
                  },
                  transition: 'opacity 0.2s, background-color 0.2s'
                }}
                onClick={() => handleArticleClick(article)}
              >
                <CardMedia
                  component="img"
                  sx={{
                    width: 140,
                    minWidth: 140,
                    height: '100%',
                    objectFit: 'cover',
                    filter: readArticles.includes(article.link) ? 'grayscale(30%)' : 'none'
                  }}
                  image={article.thumbnail}
                  alt={article.title}
                />
                
                <CardContent 
                  sx={{ 
                    flex: 1,
                    overflow: 'hidden',
                    p: 2,
                    '&:last-child': { pb: 2 } 
                  }}
                >
                  <Box sx={{ height: '100%', overflow: 'hidden' }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        mb: 0.5
                      }}
                    >
                      {article.sourceName} - {new Date(article.pubDate).toLocaleDateString()}
                    </Typography>

                    <Typography 
                      variant="subtitle1" 
                      component="h3"
                      sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.2,
                        color: readArticles.includes(article.link) ? 'text.secondary' : 'primary.main',
                      }}
                    >
                      {article.title}
                    </Typography>

                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4
                      }}
                    >
                      {article.description?.replace(/<[^>]*>/g, '') || '説明なし'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ArticleList; 