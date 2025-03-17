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
    feedName?: string;
    image?: string;
    categories?: string[];
    feed_id?: number | null;
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

// FavoriteArticleBase に相当する基本インターフェース
export interface FavoriteArticleBase {
    article_link: string;
    article_title: string;
    article_description: string | null;
    article_image: string | null;
    article_categories: string[];
    feed_id?: number | null;
    is_external?: boolean;
}

// FavoriteArticleCreate に相当する（リクエスト用）
export interface FavoriteArticleRequest extends FavoriteArticleBase {}

// FavoriteArticle に相当する（レスポンス用）
export interface FavoriteArticleData extends FavoriteArticleBase {
    id: number;
    user_id: number;
    favorited_at: Date;
}

export interface MetadataResponse {
    title: string;
    description: string;
    image: string;
    categories: string[];
}

export type MenuType = 'articles' | 'feeds' | 'favorites'; 