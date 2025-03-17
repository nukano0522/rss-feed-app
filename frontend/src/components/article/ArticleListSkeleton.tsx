import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ArticleListSkeleton: React.FC = () => {
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
};

export default ArticleListSkeleton; 