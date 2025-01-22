import React from 'react';
import {
  Card,
  CardMedia,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Container,
  Grid,
  ButtonBase,
  CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '450px', // カードの横幅
  height: '100%',
  display: 'flex',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: 'white',
  '&.read': {
    opacity: 0.7,
  },
  '& .MuiCardContent-root': {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  '& .MuiTypography-h6': {
    fontSize: '1rem',
    lineHeight: 1.4,
    marginBottom: theme.spacing(1),
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  '& .MuiTypography-body2': {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    color: theme.palette.text.secondary,
  }
}));

const StyledCardMedia = styled(CardMedia)({
  width: '160px',
  height: '160px',
  flexShrink: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  transition: 'transform 0.3s ease',
});

const StyledButtonBase = styled(ButtonBase)({
  width: '100%',
  display: 'block',
  textAlign: 'left',
  '&:hover': {
    '& .MuiCard-root': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
    '& .MuiCardMedia-root': {
      transform: 'scale(1.05)',
    },
  }
});

const ArticleList = ({ 
  articles, 
  readArticles, 
  isLoading, 
  onArticleRead 
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleArticleClick = (articleLink) => {
    onArticleRead(articleLink);
    window.open(articleLink, '_blank');
  };

  return (
    <Container 
      maxWidth={false}
      sx={{ 
        py: 3,
        px: { xs: 2, sm: 3, md: 4 },
        width: '100%',
        maxWidth: '100% !important',
        margin: 0,
      }}
    >
      <Grid 
        container 
        spacing={3}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(300px, 1fr))',
            md: 'repeat(3, minmax(350px, 1fr))',
          },
          gap: '24px 120px', // カード間の縦横のスペース
        }}
      >
        {articles.map((article, index) => (
          <Grid 
            item 
            key={article.link + index}
            sx={{ width: '100%', minWidth: 0 }}
          >
            <StyledButtonBase onClick={() => handleArticleClick(article.link)}>
              <StyledCard className={readArticles.includes(article.link) ? 'read' : ''}>
                <StyledCardMedia
                  image={article.image || article.feedImage || '/default-image.jpg'}
                  title={article.title}
                />
                <CardContent>
                  <Typography variant="caption" color="textSecondary">
                    {article.feedName} · {new Date(article.published).toLocaleDateString()}
                  </Typography>
                  <Typography variant="h6">
                    {article.title}
                  </Typography>
                  <Typography variant="body2">
                    {article.description || "説明はありません"}
                  </Typography>
                  <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                    {article.categories?.slice(0, 2).map((category, i) => (
                      <Chip
                        key={i}
                        label={category}
                        size="small"
                        sx={{ height: 24 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </StyledCard>
            </StyledButtonBase>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ArticleList; 