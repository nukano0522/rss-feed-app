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

interface MobileFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  feeds: Feed[];
  selectedFeeds: string[];
  onFilterChange: (selectedFeeds: string[]) => void;
  readFilter: 'all' | 'read' | 'unread';
  onReadFilterChange: (filter: 'all' | 'read' | 'unread') => void;
}

const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
  isOpen,
  onOpenChange,
  feeds,
  selectedFeeds,
  onFilterChange,
  readFilter,
  onReadFilterChange
}) => {
  const handleClearFilters = () => {
    onFilterChange([]);
    onReadFilterChange('all');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
                        onFilterChange(selectedFeeds.filter(id => id !== feed.id.toString()));
                      } else {
                        onFilterChange([...selectedFeeds, feed.id.toString()]);
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

        {/* フィルタークリアボタン */}
        {(selectedFeeds.length > 0 || readFilter !== 'all') && (
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            フィルターをクリア
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilterSheet; 