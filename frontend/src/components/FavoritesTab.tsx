import React, { useState } from 'react';
import ArticleList from './ArticleList';
import ExternalArticleSheet from './ExternalArticleDialog';
import { Article } from '../types';

interface FavoritesTabProps {
  articles: Article[];
  readArticles: string[];
  feeds: any[];
  isLoading: boolean;
  onArticleRead: (link: string) => void;
  favoriteArticles: string[];
  onToggleFavorite: (article: Article) => Promise<void>;
}

const FavoritesTab: React.FC<FavoritesTabProps> = ({
  articles,
  readArticles,
  feeds,
  isLoading,
  onArticleRead,
  favoriteArticles,
  onToggleFavorite
}) => {
  const [isExternalArticleSheetOpen, setIsExternalArticleSheetOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold"></h2>
        <ExternalArticleSheet
          open={isExternalArticleSheetOpen}
          onOpenChange={setIsExternalArticleSheetOpen}
          onAddArticle={onToggleFavorite}
        />
      </div>
      
      <ArticleList
        articles={articles}
        readArticles={readArticles}
        feeds={feeds}
        isLoading={isLoading}
        onArticleRead={onArticleRead}
        favoriteArticles={favoriteArticles || []} // favoriteArticlesがundefinedの場合に空配列を渡す
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
};

export default FavoritesTab; 