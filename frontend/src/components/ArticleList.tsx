import { ArticleList as ArticleListComponent } from './article';
import { ArticleListProps } from '../types/components';
import React from 'react';

const ArticleList: React.FC<ArticleListProps> = (props) => {
  return <ArticleListComponent {...props} />;
};

export default ArticleList;