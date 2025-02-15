import { Feed, Article, MenuType, NewFeed } from './index';

// Navigation Component Types
export interface NavigationProps {
  selectedMenu: MenuType;
  onMenuSelect: (menu: MenuType) => void;
}

// FeedManager Component Types
export interface FeedManagerProps {
  feeds: Feed[];
  onAddFeed: (newFeed: NewFeed) => Promise<Feed>;
  onToggleFeed: (feedId: number) => Promise<void>;
  onDeleteFeed: (feedId: number) => Promise<void>;
  onEditFeed: (feedId: number, updatedFeed: Partial<Feed>) => Promise<Feed>;
}

// ArticleList Component Types
export interface ArticleFilterProps {
  feeds: Feed[];
  selectedFeeds: string[];
  onFilterChange: (feeds: string[]) => void;
  readFilter: 'all' | 'read' | 'unread';
  onReadFilterChange: (filter: 'all' | 'read' | 'unread') => void;
}

export interface ArticleListProps {
  articles: Article[];
  readArticles: string[];
  isLoading: boolean;
  onArticleRead: (link: string) => void;
  feeds: Feed[];
  favoriteArticles: string[];
  onToggleFavorite: (article: Article) => void;
} 