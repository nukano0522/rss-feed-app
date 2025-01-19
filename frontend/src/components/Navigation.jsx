import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box
} from '@mui/material';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import ArticleIcon from '@mui/icons-material/Article';

const drawerWidth = 240;

export default function Navigation({ selectedMenu, onMenuSelect }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <Typography variant="h6" sx={{ px: 2, pb: 2 }}>
          RSSリーダー
        </Typography>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => onMenuSelect('feeds')}
              selected={selectedMenu === 'feeds'}
            >
              <ListItemIcon>
                <RssFeedIcon />
              </ListItemIcon>
              <ListItemText primary="フィード管理" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => onMenuSelect('articles')}
              selected={selectedMenu === 'articles'}
            >
              <ListItemIcon>
                <ArticleIcon />
              </ListItemIcon>
              <ListItemText primary="記事一覧" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
} 