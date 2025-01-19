import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Link,
  Box,
  Chip,
  CircularProgress,
  Container,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRssFeed } from '../hooks/useRssFeed';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&.read': {
    opacity: 0.7,
  },
}));

const StyledCardMedia = styled(CardMedia)({
  height: 200,
  backgroundSize: 'cover',
});

const ArticleList = () => {
  const { articles, readArticles, markAsRead, isLoading } = useRssFeed();
  
  const placeholderImage = '/placeholder.svg';

  // console.log('Articles in ArticleList:', articles);
  // console.log('Read Articles:', readArticles);
  // console.log('Loading state:', isLoading);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="h6" color="textSecondary">
          No articles found
        </Typography>
      </Box>
    );
  }

  const isArticleRead = (articleLink) => {
    return readArticles.includes(articleLink);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={6}>
        {articles.map((article, index) => (
          <Grid item xs={12} sm={6} md={4} key={`${article.link}-${index}`}>
            <StyledCard className={isArticleRead(article.link) ? 'read' : ''}>
              <StyledCardMedia
                component="img"
                image={article.image || placeholderImage}
                alt={article.title}
                onError={(e) => {
                  e.target.src = placeholderImage;
                  e.target.onerror = null;
                }}
              />
              <CardContent>
                <Typography 
                  variant="h6" 
                  component="div"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  <Link
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markAsRead(article.link)}
                    color="inherit"
                    underline="hover"
                  >
                    {article.title}
                  </Link>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {article.feedName}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {article.description}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(article.published).toLocaleDateString()}
                  </Typography>
                  {article.categories && article.categories.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {article.categories.map((category, i) => (
                        <Chip
                          key={i}
                          label={category}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ArticleList; 