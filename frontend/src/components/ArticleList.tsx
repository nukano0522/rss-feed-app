import React, { useState, useMemo } from 'react';
import { ArticleFilterProps, ArticleListProps } from '../types/components';
import { Article } from '../types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Star, StarOff, Wand2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { feedsApi } from '../services/api'

const ArticleFilter: React.FC<ArticleFilterProps> = ({
  feeds,
  selectedFeeds,
  onFilterChange,
  readFilter,
  onReadFilterChange
}) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">フィードでフィルター</h3>
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

  const feedImageMap = useMemo(() => {
    return feeds.reduce((acc, feed) => {
      acc[feed.url] = feed.default_image;
      return acc;
    }, {} as Record<string, string | null>);
  }, [feeds]);

  const feedIdMap = useMemo(() => {
    return feeds.reduce((acc, feed) => {
      acc[feed.url] = feed.id;
      return acc;
    }, {} as Record<string, number>);
  }, [feeds]);

  const feedNameMap = useMemo(() => {
    return feeds.reduce((acc, feed) => {
      acc[feed.url] = feed.name;
      return acc;
    }, {} as Record<string, string>);
  }, [feeds]);

  const handleToggleFavorite = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    const feedId = feedIdMap[article.feedUrl];
    if (feedId) {
      onToggleFavorite({
        ...article,
        feed_id: feedId
      });
    }
  };

  const handleSummarize = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    const feedId = feedIdMap[article.feedUrl];
    if (feedId) {
      try {
        setLoadingSummaries(prev => ({ ...prev, [article.link]: true }));
        const response = await feedsApi.summarizeArticle(article, feedId);
        setSummaries(prev => ({ ...prev, [article.link]: response.data.summary }));
      } catch (error) {
        console.error('Error getting summary:', error);
      } finally {
        setLoadingSummaries(prev => ({ ...prev, [article.link]: false }));
      }
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
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video">
                <Skeleton className="w-full h-full" />
              </div>
              <CardContent className="mt-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <ArticleFilter
        feeds={feeds}
        selectedFeeds={selectedFeeds}
        onFilterChange={setSelectedFeeds}
        readFilter={readFilter}
        onReadFilterChange={setReadFilter}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article, index) => (
          <div key={article.link + index}>
            <HoverCard>
              <Card className="overflow-hidden transition-all hover:shadow-lg h-[240px]">
                <div className={`relative cursor-pointer flex h-full`} 
                     onClick={() => handleArticleClick(article.link)}
                     tabIndex={0}
                     onKeyDown={(e) => e.key === 'Enter' && handleArticleClick(article.link)}
                     aria-label={`記事: ${article.title}`}>
                  <div className="w-[120px] h-full relative flex-shrink-0">
                    <img
                      src={article.image || feedImageMap[article.feedUrl] || '/default-image.jpg'}
                      alt={article.title}
                      className={`object-cover w-full h-full ${readArticles.includes(article.link) ? 'opacity-70' : ''}`}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
                            onClick={(e) => handleToggleFavorite(article, e)}
                            aria-label={favoriteArticles.includes(article.link) ? "お気に入りから削除" : "お気に入りに追加"}
                          >
                            {favoriteArticles.includes(article.link) ? (
                              <Star className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>お気に入り{favoriteArticles.includes(article.link) ? 'から削除' : 'に追加'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-12 right-2 bg-white/80 hover:bg-white/90"
                        onClick={(e) => handleSummarize(article, e)}
                        disabled={loadingSummaries[article.link]}
                        aria-label="AI要約を生成"
                      >
                        {loadingSummaries[article.link] ? (
                          <Skeleton className="h-4 w-4 rounded-full" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                      </Button>
                    </HoverCardTrigger>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground mb-1 truncate">
                        {article.feedName || feedNameMap[article.feedUrl] || article.feedUrl} | {article.published ? new Date(article.published).toLocaleDateString() : '日付なし'}
                      </div>
                      <CardTitle className="text-base mb-1 line-clamp-4">
                        {article.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.description || "説明はありません"}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {article.categories?.slice(0, 2).map((category, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
              {summaries[article.link] && (
                <HoverCardContent side="right" align="start" className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">AI要約</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {summaries[article.link]}
                    </p>
                  </div>
                </HoverCardContent>
              )}
            </HoverCard>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleList; 