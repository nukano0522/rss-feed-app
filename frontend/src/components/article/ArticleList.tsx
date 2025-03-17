import React, { useState, useMemo, useEffect } from 'react';
import { ArticleListProps } from '@/types/components';
import { Article } from '@/types';
import { feedsApi } from '@/services/api';
import {
  ArticleCard,
  ArticleFilter,
  ArticleListSkeleton,
  NoArticlesFound,
  SummaryDialog
} from './';

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  readArticles,
  isLoading,
  onArticleRead,
  feeds,
  favoriteArticles,
  onToggleFavorite
}) => {
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>([]);
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [currentSummaryArticle, setCurrentSummaryArticle] = useState<Article | null>(null);

  // 画面サイズの検出
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // フィードマップの作成
  const feedImageMap = useMemo<Record<string, string | null>>(() => {
    return feeds.reduce((acc, feed) => {
      acc[feed.url] = feed.default_image;
      return acc;
    }, {} as Record<string, string | null>);
  }, [feeds]);

  const feedIdMap = useMemo<Record<string, number>>(() => {
    return feeds.reduce((acc, feed) => {
      acc[feed.url] = feed.id;
      return acc;
    }, {} as Record<string, number>);
  }, [feeds]);

  const feedNameMap = useMemo<Record<string, string>>(() => {
    return feeds.reduce((acc, feed) => {
      acc[feed.url] = feed.name;
      return acc;
    }, {} as Record<string, string>);
  }, [feeds]);

  // お気に入り切り替え処理
  const handleToggleFavorite = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 外部記事の場合は feedId を null として扱う
    const isExternal = article.feedUrl === 'external://articles';
    const feedId = isExternal ? null : feedIdMap[article.feedUrl];
    
    onToggleFavorite({
      ...article,
      feed_id: feedId
    });
  };

  // 要約生成処理
  const handleSummarize = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 現在の記事を設定
    setCurrentSummaryArticle(article);
    
    // 既に要約がある場合はダイアログを表示して終了
    if (summaries[article.link]) {
      setShowSummaryDialog(true);
      return;
    }
    
    // 外部記事の場合は feedId を 0 として扱う
    const isExternal = article.feedUrl === 'external://articles';
    const feedId = isExternal ? 0 : feedIdMap[article.feedUrl];
    
    // 処理中の状態を設定
    setLoadingSummaries(prev => ({ ...prev, [article.link]: true }));
    setShowSummaryDialog(true); // 処理中もダイアログを表示
    
    try {
      const response = await feedsApi.summarizeArticle(article, feedId || 0);
      
      if (response.data && response.data.summary) {
        setSummaries(prev => ({ ...prev, [article.link]: response.data.summary }));
      } else {
        throw new Error('要約データが取得できませんでした');
      }
    } catch (error) {
      console.error('Error getting summary:', error);
      // エラーメッセージを設定
      setSummaries(prev => ({ 
        ...prev, 
        [article.link]: '要約の生成中にエラーが発生しました。後でもう一度お試しください。' 
      }));
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [article.link]: false }));
    }
  };

  // フィルタリング処理
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      if (selectedFeeds.length > 0) {
        const feed = feeds.find(f => f.url === article.feedUrl);
        if (!feed || !selectedFeeds.includes(feed.id.toString())) {
          return false;
        }
      }

      const isRead = readArticles.includes(article.link);
      if (readFilter === 'read' && !isRead) return false;
      if (readFilter === 'unread' && isRead) return false;

      return true;
    });
  }, [articles, selectedFeeds, feeds, readFilter, readArticles]);

  // 記事クリック処理
  const handleArticleClick = (articleLink: string): void => {
    onArticleRead(articleLink);
    window.open(articleLink, '_blank');
  };

  // ローディング中の表示
  if (isLoading) {
    return <ArticleListSkeleton />;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6">
      {/* AI要約ダイアログ */}
      <SummaryDialog
        article={currentSummaryArticle}
        isOpen={showSummaryDialog}
        onOpenChange={setShowSummaryDialog}
        summary={currentSummaryArticle ? summaries[currentSummaryArticle.link] : undefined}
        isLoading={currentSummaryArticle ? loadingSummaries[currentSummaryArticle.link] : false}
      />

      {/* モバイル向けフィルターボタン */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">記事一覧</h2>
        <ArticleFilter
          isOpen={showFilterSheet}
          onOpenChange={setShowFilterSheet}
          feeds={feeds}
          selectedFeeds={selectedFeeds}
          onFilterChange={setSelectedFeeds}
          readFilter={readFilter}
          onReadFilterChange={setReadFilter}
          isMobile={true}
        />
      </div>

      {/* デスクトップ向けフィルター */}
      <div className="hidden md:block">
        <ArticleFilter
          feeds={feeds}
          selectedFeeds={selectedFeeds}
          onFilterChange={setSelectedFeeds}
          readFilter={readFilter}
          onReadFilterChange={setReadFilter}
          isMobile={false}
        />
      </div>

      {filteredArticles.length === 0 ? (
        <NoArticlesFound 
          selectedFeeds={selectedFeeds}
          readFilter={readFilter}
          onClearFilters={() => {
            setSelectedFeeds([]);
            setReadFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredArticles.map((article, index) => (
            <div key={article.link + index}>
              <ArticleCard
                article={article}
                readArticles={readArticles}
                favoriteArticles={favoriteArticles}
                feedImageMap={feedImageMap}
                feedNameMap={feedNameMap}
                loadingSummaries={loadingSummaries}
                onArticleClick={handleArticleClick}
                onToggleFavorite={handleToggleFavorite}
                onSummarize={handleSummarize}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleList; 