import { ListItem, ListItemText, Typography } from '@mui/material';
import { useRssFeed } from '../hooks/useRssFeed';

const ArticleItem = ({ article }) => {
  const { onArticleRead } = useRssFeed();

  const handleClick = () => {
    onArticleRead(article.link);
    window.open(article.link, '_blank');
  };

  return (
    <ListItem 
      button 
      onClick={handleClick}
      sx={{
        opacity: article.read ? 0.6 : 1,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
        marginBottom: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <ListItemText
        primary={
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: article.read ? 'normal' : 'bold',
              color: article.read ? 'text.secondary' : 'text.primary'
            }}
          >
            {article.title}
          </Typography>
        }
        secondary={
          <>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {article.feedName} • {new Date(article.published).toLocaleString()}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {article.summary}
            </Typography>
          </>
        }
      />
    </ListItem>
  );
};

export default ArticleItem; 