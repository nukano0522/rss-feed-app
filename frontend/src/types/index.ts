export interface LoginFormData {
    email: string;
    password: string;
  }

export interface Feed {
    id: number;
    name: string;
    url: string;
    enabled: boolean;
    default_image: string | null;
  }

export interface NewFeed {
    name: string;
    url: string;
    defaultImage: string;
  }

export interface Article {
    title: string;
    link: string;
    description?: string;
    published?: Date;
    feedUrl: string;
    image?: string;
    categories?: string[];
}

export interface RssEntry {
    title: string;
    link: string;
    description?: string;
    published: string;
    image?: string;
    categories?: string[];
  }
  
export interface RssFeedResponse {
    entries: RssEntry[];
    status: string;
    feed: any;
    code?: number;
  }

export interface FavoriteArticleRequest {
    article_link: string;
    article_title: string;
    article_description: string;
    article_image: string;
    article_categories: string[];
  }

export interface FavoriteArticleData {
  article_title: string;
  article_link: string;
  article_description: string | null;
  article_image: string | null;
  article_categories: string[];
  favorited_at: Date;
}

export type MenuType = 'articles' | 'feeds' | 'favorites'; 