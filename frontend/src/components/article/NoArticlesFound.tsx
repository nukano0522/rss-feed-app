import React, { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NoArticlesFoundProps {
  selectedFeeds: string[];
  readFilter: 'all' | 'read' | 'unread';
  onClearFilters: () => void;
}

const NoArticlesFound: React.FC<NoArticlesFoundProps> = ({ 
  selectedFeeds, 
  readFilter, 
  onClearFilters 
}) => {
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

export default NoArticlesFound; 