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
  Box,
  Button
} from '@mui/material';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import ArticleIcon from '@mui/icons-material/Article';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/useAuth.jsx';

const drawerWidth = 240;

export default function Navigation({ selectedMenu, onMenuSelect }) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ pb: 2 }}>
            RSSリーダー
          </Typography>
        </Box>
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
        <Box sx={{ flexGrow: 1 }} /> {/* スペーサー */}
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="ログアウト" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
} 