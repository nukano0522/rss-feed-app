import React, { useState, useMemo, useEffect } from 'react';
import { ArticleFilterProps, ArticleListProps } from '../types/components';
import { Article } from '../types';
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Star, StarOff, Wand2, Filter, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "../components/ui/sheet"
import { feedsApi } from '../services/api'

const ArticleFilter: React.FC<ArticleFilterProps> = ({
  feeds,
  selectedFeeds,
  onFilterChange,
  readFilter,
  onReadFilterChange
}) => {
  // モバイル向けのフィルターシート
  const FilterContent = () => (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">フィードでフィルター</h3>
        <ScrollArea className="h-[200px]">
          <div className="flex flex-wrap gap-2">
            {feeds.map((feed) => (
              <Badge
                key={feed.id}
                variant={selectedFeeds.includes(feed.id.toString()) ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80"
                onClick={() => {
                  if (selectedFeeds.includes(feed.id.toString())) {
                    onFilterChange(selectedFeeds.filter(id => id !== feed.id.toString()));
                  } else {
                    onFilterChange([...selectedFeeds, feed.id.toString()]);
                  }
                }}
              >
                {feed.name}
              </Badge>
            ))}
            {selectedFeeds.length > 0 && (
              <Badge
                variant="outline"
                className="cursor-pointer hover:opacity-80"
                onClick={() => onFilterChange([])}
              >
                すべて表示
              </Badge>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">既読状態</h3>
        <div className="flex gap-2">
          <Badge
            variant={readFilter === 'all' ? "default" : "outline"}
            className="cursor-pointer hover:opacity-80"
            onClick={() => onReadFilterChange('all')}
          >
            すべて
          </Badge>
          <Badge
            variant={readFilter === 'unread' ? "default" : "outline"}
            className="cursor-pointer hover:opacity-80"
            onClick={() => onReadFilterChange('unread')}
          >
            未読
          </Badge>
          <Badge
            variant={readFilter === 'read' ? "default" : "outline"}
            className="cursor-pointer hover:opacity-80"
            onClick={() => onReadFilterChange('read')}
          >
            既読
          </Badge>
        </div>
      </div>
    </div>
  );

  // デスクトップ表示
  return (
    <div className="mb-6">
      {/* モバイル向けフィルターボタン */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">記事一覧</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              フィルター
              {(selectedFeeds.length > 0 || readFilter !== 'all') && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {selectedFeeds.length + (readFilter !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>フィルター設定</SheetTitle>
              <SheetDescription>
                記事の表示条件を設定します
              </SheetDescription>
            </SheetHeader>
            <FilterContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* デスクトップ向けフィルター */}
      <div className="hidden md:block">
        <FilterContent />
      </div>
    </div>
  );
};

// 記事が見つからない場合のコンポーネント
const NoArticlesFound: React.FC<{
  selectedFeeds: string[];
  readFilter: 'all' | 'read' | 'unread';
  onClearFilters: () => void;
}> = ({ selectedFeeds, readFilter, onClearFilters }) => {
  const hasFilters = useMemo(() => 
    selectedFeeds.length > 0 || readFilter !== 'all',
    [selectedFeeds.length, readFilter]
  );
  
  return (
    <div className="text-center py-12">
      <h3 className="text-xl font-medium mb-2">記事が見つかりません</h3>
      <p className="text-muted-foreground">フィルター条件を変更してみてください</p>
      {hasFilters && (
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onClearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          フィルターをクリア
        </Button>
      )}
    </div>
  );
};

// 記事カードコンポーネント
interface ArticleCardProps {
  article: Article;
  readArticles: string[];
  favoriteArticles: string[];
  feedImageMap: Record<string, string | null>;
  feedNameMap: Record<string, string>;
  loadingSummaries: Record<string, boolean>;
  onArticleClick: (link: string) => void;
  onToggleFavorite: (article: Article, e: React.MouseEvent) => void;
  onSummarize: (article: Article, e: React.MouseEvent) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  readArticles,
  favoriteArticles,
  feedImageMap,
  feedNameMap,
  loadingSummaries,
  onArticleClick,
  onToggleFavorite,
  onSummarize
}) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg h-auto sm:h-[240px]">
      <div 
        className="relative cursor-pointer flex flex-row h-full" 
        onClick={() => onArticleClick(article.link)}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onArticleClick(article.link)}
        aria-label={`記事: ${article.title}`}
      >
        <div className="w-[100px] h-full relative flex-shrink-0">
          <img
            src={article.image || feedImageMap[article.feedUrl] || '/default-image.jpg'}
            alt={article.title}
            className={`object-cover w-full h-full ${readArticles.includes(article.link) ? 'opacity-70' : ''}`}
          />
          <div className="absolute top-1 right-1 flex flex-col gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 bg-white/80 hover:bg-white/90"
                    onClick={(e) => onToggleFavorite(article, e)}
                    aria-label={favoriteArticles.includes(article.link) ? "お気に入りから削除" : "お気に入りに追加"}
                  >
                    {favoriteArticles.includes(article.link) ? (
                      <Star className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <StarOff className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>お気に入り{favoriteArticles.includes(article.link) ? 'から削除' : 'に追加'}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${loadingSummaries[article.link] ? 'bg-primary/20 hover:bg-primary/30' : 'bg-white/80 hover:bg-white/90'}`}
                    onClick={(e) => onSummarize(article, e)}
                    disabled={loadingSummaries[article.link]}
                    aria-label={loadingSummaries[article.link] ? "AI要約を生成中..." : "AI要約を生成"}
                  >
                    {loadingSummaries[article.link] ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{loadingSummaries[article.link] ? "AI要約を生成中..." : "AI要約を生成"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <CardContent className="p-2 sm:p-3">
            <div className="text-xs text-muted-foreground mb-1 truncate">
              {article.feedName || feedNameMap[article.feedUrl] || article.feedUrl} | {article.published ? new Date(article.published).toLocaleDateString() : '日付なし'}
            </div>
            <CardTitle className="text-sm sm:text-base mb-1 line-clamp-2 sm:line-clamp-4">
              {article.title}
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
              {article.description || "説明はありません"}
            </p>
            <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
              {article.categories?.slice(0, 2).map((category, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] sm:text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

// 要約ダイアログコンポーネント
interface SummaryDialogProps {
  article: Article | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string | undefined;
  isLoading: boolean;
}

const SummaryDialog: React.FC<SummaryDialogProps> = ({
  article,
  isOpen,
  onOpenChange,
  summary,
  isLoading
}) => {
  if (!article) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">AI要約</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <h3 className="text-base font-medium mb-2">{article.title}</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-sm whitespace-pre-line">
                {summary || "要約を生成できませんでした。"}
              </p>
            </div>
          )}
          <div className="mt-4 text-xs text-muted-foreground">
            <p>元記事: <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{article.link}</a></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
      // エラーメッセージを設定（実際のUIには表示されませんが、将来的に表示する場合に備えて）
      setSummaries(prev => ({ 
        ...prev, 
        [article.link]: '要約の生成中にエラーが発生しました。後でもう一度お試しください。' 
      }));
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [article.link]: false }));
    }
  };

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

  const handleArticleClick = (articleLink: string): void => {
    onArticleRead(articleLink);
    window.open(articleLink, '_blank');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 md:px-6">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">記事を読み込み中...</h2>
          <div className="flex justify-center items-center gap-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden border border-muted/50 h-auto sm:h-[240px]">
              <div className="flex flex-row h-full">
                <div className="w-[100px] sm:w-[120px] h-full relative flex-shrink-0">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="flex-1 p-2 sm:p-3">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-4 sm:h-5 w-full mb-2 sm:mb-3" />
                  <Skeleton className="h-3 sm:h-4 w-full mb-1 sm:mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-full mb-1 sm:mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-3/4 mb-2 sm:mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 sm:h-5 w-12 sm:w-16 rounded-full" />
                    <Skeleton className="h-4 sm:h-5 w-12 sm:w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
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
        <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              フィルター
              {(selectedFeeds.length > 0 || readFilter !== 'all') && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {selectedFeeds.length + (readFilter !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] sm:w-[385px]">
            <SheetHeader>
              <SheetTitle>フィルター</SheetTitle>
              <SheetDescription>
                表示する記事を選択
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-4 space-y-6">
              {/* フィードフィルター */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">フィード</h3>
                <ScrollArea className="h-[200px]">
                  <div className="flex flex-wrap gap-2">
                    {feeds.map((feed) => (
                      <Badge
                        key={feed.id}
                        variant={selectedFeeds.includes(feed.id.toString()) ? "default" : "outline"}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => {
                          if (selectedFeeds.includes(feed.id.toString())) {
                            setSelectedFeeds(selectedFeeds.filter(id => id !== feed.id.toString()));
                          } else {
                            setSelectedFeeds([...selectedFeeds, feed.id.toString()]);
                          }
                        }}
                      >
                        {feed.name}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* 既読状態フィルター */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">既読状態</h3>
                <div className="flex gap-2">
                  <Badge
                    variant={readFilter === 'all' ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => setReadFilter('all')}
                  >
                    すべて
                  </Badge>
                  <Badge
                    variant={readFilter === 'unread' ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => setReadFilter('unread')}
                  >
                    未読
                  </Badge>
                  <Badge
                    variant={readFilter === 'read' ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => setReadFilter('read')}
                  >
                    既読
                  </Badge>
                </div>
              </div>
            </div>

            {/* フィルタークリアボタン */}
            {(selectedFeeds.length > 0 || readFilter !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => {
                  setSelectedFeeds([]);
                  setReadFilter('all');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                フィルターをクリア
              </Button>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* デスクトップ向けフィルター */}
      <div className="hidden md:block">
        <ArticleFilter
          feeds={feeds}
          selectedFeeds={selectedFeeds}
          onFilterChange={setSelectedFeeds}
          readFilter={readFilter}
          onReadFilterChange={setReadFilter}
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