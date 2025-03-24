import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger
} from "../components/ui/sheet";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2, Plus } from "lucide-react";
import { Article, MetadataResponse } from '../types';
import { feedsApi } from '../services/api';

interface ExternalArticleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddArticle: (article: Article) => Promise<void>;
}

const ExternalArticleSheet: React.FC<ExternalArticleSheetProps> = ({
  open,
  onOpenChange,
  onAddArticle
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [categories, setCategories] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMetadata = async () => {
    if (!url) {
      setError('URLを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await feedsApi.extractMetadata(url);
      const metadata = response.data as MetadataResponse;
      
      setTitle(metadata.title || '');
      setDescription(metadata.description || '');
      setImage(metadata.image || '');
      setCategories(metadata.categories?.join(', ') || '');
    } catch (error) {
      console.error('メタデータ取得エラー:', error);
      setError('メタデータの取得に失敗しました。手動で入力してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!url || !title) {
      setError('URLとタイトルは必須です');
      return;
    }

    const article: Article = {
      title,
      link: url,
      description,
      image,
      categories: categories ? categories.split(',').map(c => c.trim()) : [],
      feedUrl: 'external://articles',
      feed_id: null // 外部記事の場合はnull
    };

    try {
      await onAddArticle(article);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('記事追加エラー:', error);
      setError('記事の追加に失敗しました');
    }
  };

  const resetForm = () => {
    setUrl('');
    setTitle('');
    setDescription('');
    setImage('');
    setCategories('');
    setError('');
  };

  const handleSheetChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetChange}>
      <SheetTrigger asChild>
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          記事を追加
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[500px] max-h-[100dvh] overflow-y-auto">
        <SheetTitle>記事をお気に入りに追加</SheetTitle>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              URLを入力:
            </label>
            <div className="flex gap-2">
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
              />
              <Button 
                onClick={fetchMetadata} 
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    取得中
                  </>
                ) : '情報取得'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              タイトル:
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="記事のタイトル"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              説明:
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="記事の説明"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="categories" className="text-sm font-medium">
              カテゴリ（カンマ区切り）:
            </label>
            <Input
              id="categories"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="ニュース, テクノロジー, etc."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image" className="text-sm font-medium">
              画像URL（オプション）:
            </label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">プレビュー:</h3>
            <Card>
              <CardContent className="p-4 flex gap-4">
                <div className="w-16 h-16 bg-muted flex-shrink-0">
                  {image && (
                    <img 
                      src={image} 
                      alt={title} 
                      className="w-full h-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.src = '/default-image.jpg';
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">{title || 'タイトルなし'}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {description || '説明なし'}
                  </p>
                  {categories && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {categories.split(',').map((category, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {category.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <SheetFooter className="pt-4 mt-2 bg-background flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            追加する
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ExternalArticleSheet; 