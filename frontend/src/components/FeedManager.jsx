import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  List,
  ListItem,
  Typography,
  Box,
  Switch,
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useRssFeed } from '../hooks/useRssFeed';

// デフォルト画像の定義
const DEFAULT_IMAGES = {
  'azure_blog.svg': '/default-images/Microsoft_Azure.svg',
  'aws_blog.svg': '/default-images/Amazon_Web_Services_Logo.svg',
  'hatena_bookmark.svg': '/default-images/hatenabookmark_symbolmark.png',
  // 必要に応じて追加
};

// https://b.hatena.ne.jp/entrylist/it.rss
// https://aws.amazon.com/jp/blogs/aws/feed/
// https://azure.microsoft.com/ja-jp/blog/feed/

const FeedManager = () => {
  const [newFeed, setNewFeed] = useState({
    name: '',
    url: '',
    defaultImage: ''
  });
  const [editingFeed, setEditingFeed] = useState(null);
  const { feeds, handleAddFeed, handleEditFeed, handleToggleFeed, handleDeleteFeed } = useRssFeed();

  const handleAddNewFeed = () => {
    if (newFeed.name && newFeed.url) {
      handleAddFeed({
        name: newFeed.name,
        url: newFeed.url,
        enabled: true,
        default_image: newFeed.defaultImage || null
      });
      setNewFeed({ name: '', url: '', defaultImage: '' });
    }
  };

  const handleEditClick = (feed) => {
    setEditingFeed(feed);
    setNewFeed({
      name: feed.name,
      url: feed.url,
      defaultImage: feed.default_image || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingFeed) return;

    const updatedFeed = {
      name: newFeed.name,
      url: newFeed.url,
      enabled: editingFeed.enabled,
      default_image: newFeed.defaultImage || null
    };

    console.log('handleSaveEdit:', {
      feedId: editingFeed.id,
      updatedFeed
    });

    try {
      await handleEditFeed(editingFeed.id, updatedFeed);
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
    } finally {
      setEditingFeed(null);
      setNewFeed({ name: '', url: '', defaultImage: '' });
    }
  };

  const handleCancelEdit = () => {
    setEditingFeed(null);
    setNewFeed({ name: '', url: '', defaultImage: '' });
  };

  const handleInputChange = (field) => (event) => {
    setNewFeed({
      ...newFeed,
      [field]: event.target.value
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          RSSフィード管理
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ページ名"
              value={newFeed.name}
              onChange={handleInputChange('name')}
              placeholder="例：はてなブックマーク"
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="フィードURL"
              value={newFeed.url}
              onChange={handleInputChange('url')}
              placeholder="RSSフィードのURLを入力"
              required
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>デフォルト画像</InputLabel>
              <Select
                value={newFeed.defaultImage}
                onChange={handleInputChange('defaultImage')}
                label="デフォルト画像"
              >
                <MenuItem value="">
                  <em>なし</em>
                </MenuItem>
                {Object.entries(DEFAULT_IMAGES).map(([name, path]) => (
                  <MenuItem key={name} value={path}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <img 
                        src={path} 
                        alt={name} 
                        style={{ width: 24, height: 24 }} 
                      />
                      {name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            {editingFeed ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSaveEdit}
                  fullWidth
                  sx={{ height: '56px' }}
                  disabled={!newFeed.name || !newFeed.url}
                >
                  保存
                </Button>
                <Button 
                  variant="outlined"
                  onClick={handleCancelEdit}
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  キャンセル
                </Button>
              </Box>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleAddNewFeed}
                fullWidth
                sx={{ height: '56px' }}
                disabled={!newFeed.name || !newFeed.url}
              >
                追加
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      <List>
        {feeds.map((feed) => (
          <ListItem 
            key={feed.id}
            sx={{ 
              pr: 8,
              opacity: feed.enabled ? 1 : 0.5,
              transition: 'opacity 0.3s'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {feed.default_image && (
                <img 
                  src={feed.default_image} 
                  alt={feed.name} 
                  style={{ width: 24, height: 24 }} 
                />
              )}
              <ListItemText 
                primary={feed.name || '名称未設定'}
                secondary={feed.url}
                sx={{ 
                  wordBreak: 'break-all',
                  mr: 2
                }}
              />
            </Box>
            <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center' }}>
              <Switch
                edge="end"
                checked={feed.enabled}
                onChange={() => handleToggleFeed(feed.id)}
                inputProps={{ 'aria-label': 'toggle feed' }}
              />
              <IconButton 
                edge="end" 
                aria-label="edit"
                onClick={() => handleEditClick(feed)}
                sx={{ ml: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => handleDeleteFeed(feed.id)}
                sx={{ ml: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default FeedManager; 