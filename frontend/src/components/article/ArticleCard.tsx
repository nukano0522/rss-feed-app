import React from 'react';
import { Article } from '@/types';
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Star, StarOff, Wand2 } from "lucide-react";

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

export default ArticleCard; 