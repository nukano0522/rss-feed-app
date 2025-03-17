import React from 'react';
import { ArticleFilterProps } from '@/types/components';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

const ArticleFilter: React.FC<ArticleFilterProps> = ({
  feeds,
  selectedFeeds,
  onFilterChange,
  readFilter,
  onReadFilterChange
}) => {
  // フィルターコンテンツコンポーネント
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
        <h2 className="text-xl font-bold"></h2>
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

export default ArticleFilter; 