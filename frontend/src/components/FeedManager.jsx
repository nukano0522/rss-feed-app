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
  InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

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

const FeedManager = ({ feeds, onAddFeed, onToggleFeed, onDeleteFeed, onEditFeed }) => {
  const [newFeed, setNewFeed] = useState({
    name: '',
    url: '',
    defaultImage: ''
  });
  const [editingFeed, setEditingFeed] = useState(null);

  const handleAddFeed = () => {
    if (newFeed.name && newFeed.url) {
      onAddFeed(newFeed);
      setNewFeed({ name: '', url: '', defaultImage: '' });
    }
  };

  const handleEditClick = (feed, index) => {
    setEditingFeed({ ...feed, index });
    setNewFeed({ 
      name: feed.name, 
      url: feed.url, 
      defaultImage: feed.defaultImage || '' 
    });
  };

  const handleSaveEdit = () => {
    if (newFeed.name && newFeed.url && editingFeed !== null) {
      const updatedFeed = {
        ...editingFeed,
        name: newFeed.name,
        url: newFeed.url,
        defaultImage: newFeed.defaultImage
      };
      onEditFeed(editingFeed.index, updatedFeed);
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
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        RSSフィード管理
      </Typography>
      
      <Grid container spacing={2} sx={{ marginBottom: 2 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="ページ名"
            value={newFeed.name}
            onChange={handleInputChange('name')}
            placeholder="例：はてなブックマーク"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="フィードURL"
            value={newFeed.url}
            onChange={handleInputChange('url')}
            placeholder="RSSフィードのURLを入力"
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
              onClick={handleAddFeed}
              fullWidth
              sx={{ height: '56px' }}
            >
              追加
            </Button>
          )}
        </Grid>
      </Grid>

      <List>
        {feeds.map((feed, index) => (
          <ListItem 
            key={index} 
            sx={{ 
              pr: 8,
              opacity: feed.enabled ? 1 : 0.5,
              transition: 'opacity 0.3s'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {feed.defaultImage && (
                <img 
                  src={feed.defaultImage} 
                  alt="Default" 
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
                checked={feed.enabled || false}
                onChange={() => onToggleFeed(index)}
                inputProps={{ 'aria-label': 'toggle feed' }}
              />
              <IconButton 
                edge="end" 
                aria-label="edit"
                onClick={() => handleEditClick(feed, index)}
                sx={{ ml: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => onDeleteFeed(index)}
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