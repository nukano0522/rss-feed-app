import React, { useState, useMemo } from 'react';
import { ArticleFilterProps, ArticleListProps } from '../types/components';
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
import { Star, StarOff } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

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

  const feedImageMap = useMemo(() => {
    return feeds.reduce((acc, feed) => {
      acc[feed.url] = feed.default_image;
      return acc;
    }, {} as Record<string, string | null>);
  }, [feeds]);

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
          <Card
            key={article.link + index}
            className={`overflow-hidden transition-all hover:shadow-lg ${
              readArticles.includes(article.link) ? 'opacity-70' : ''
            } h-[240px]`}
          >
            <div className="relative cursor-pointer flex h-full" onClick={() => handleArticleClick(article.link)}>
              <div className="w-[120px] h-full relative flex-shrink-0">
                <img
                  src={article.image || feedImageMap[article.feedUrl] || '/default-image.jpg'}
                  alt={article.title}
                  className="object-cover w-full h-full"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(article);
                        }}
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
              </div>
              <div className="flex-1 min-w-0">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground mb-1 truncate">
                    {article.feedUrl} | {article.published ? new Date(article.published).toLocaleDateString() : '日付なし'}
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
        ))}
      </div>
    </div>
  );
};

export default ArticleList; 