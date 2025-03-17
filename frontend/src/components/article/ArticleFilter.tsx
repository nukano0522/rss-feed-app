import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Feed } from '@/types';

interface ArticleFilterProps {
  feeds: Feed[];
  selectedFeeds: string[];
  onFilterChange: (selectedFeeds: string[]) => void;
  readFilter: 'all' | 'read' | 'unread';
  onReadFilterChange: (filter: 'all' | 'read' | 'unread') => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
}

const ArticleFilter: React.FC<ArticleFilterProps> = ({
  feeds,
  selectedFeeds,
  onFilterChange,
  readFilter,
  onReadFilterChange,
  isOpen,
  onOpenChange,
  isMobile = false
}) => {
  const handleClearFilters = () => {
    onFilterChange([]);
    onReadFilterChange('all');
  };

  // フィルターコンテンツコンポーネント
  const FilterContent = () => (
    <div className="space-y-6 py-4">
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
                    onFilterChange(selectedFeeds.filter(id => id !== feed.id.toString()));
                  } else {
                    onFilterChange([...selectedFeeds, feed.id.toString()]);
                  }
                }}
              >
                {feed.name}
              </Badge>
            ))}
            {selectedFeeds.length > 0 && !isMobile && (
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

      {/* フィルタークリアボタン（モバイル時のみ表示） */}
      {isMobile && (selectedFeeds.length > 0 || readFilter !== 'all') && (
        <Button 
          variant="outline" 
          className="mt-4 w-full"
          onClick={handleClearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          フィルターをクリア
        </Button>
      )}
    </div>
  );

  // モバイル表示
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-1 text-foreground">
            <Filter className="h-4 w-4" />
            フィルター
            {(selectedFeeds.length > 0 || readFilter !== 'all') && (
              <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
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
          <FilterContent />
        </SheetContent>
      </Sheet>
    );
  }

  // デスクトップ表示
  return (
    <div className="mb-6">
      <FilterContent />
    </div>
  );
};

export default ArticleFilter; 