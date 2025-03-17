import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Article } from '@/types';

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
            <div className="bg-card p-4 rounded-md border">
              <p className="text-sm whitespace-pre-line text-foreground">
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

export default SummaryDialog; 