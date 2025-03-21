import React, { useState, useEffect } from 'react';
import { Feed, NewFeed } from '../types';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, ExternalLink } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// デフォルト画像の定義
const DEFAULT_IMAGES: Record<string, string> = {
  'azure_blog.svg': '/default-images/Microsoft_Azure.svg',
  'aws_blog.svg': '/default-images/Amazon_Web_Services_Logo.svg',
  'hatena_bookmark.svg': '/default-images/hatenabookmark_symbolmark.png',
  'nikkei_digital.jpeg': '/default-images/nikkei_digital.jpeg',
  'arxiv-logo.svg': '/default-images/arxiv-logo.svg',
};

interface FeedManagerProps {
  feeds: Feed[];
  onAddFeed: (newFeed: Omit<Feed, "id">) => Promise<Feed>;
  onToggleFeed: (feedId: number) => Promise<void>;
  onDeleteFeed: (feedId: number) => Promise<void>;
  onEditFeed: (feedId: number, updatedFeed: Partial<Feed>) => Promise<Feed>;
}

const FeedManager: React.FC<FeedManagerProps> = ({
  feeds,
  onAddFeed,
  onToggleFeed,
  onDeleteFeed,
  onEditFeed
}) => {
  const [newFeed, setNewFeed] = useState<NewFeed>({
    name: '',
    url: '',
    defaultImage: ''
  });
  const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 画面サイズの検出
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const handleAddNewFeed = (): void => {
    if (!newFeed.name || !newFeed.url) return;
    
    onAddFeed({
      name: newFeed.name,
      url: newFeed.url,
      enabled: true,
      default_image: newFeed.defaultImage || null
    });
    setNewFeed({ name: '', url: '', defaultImage: '' });
  };

  const handleEditClick = (feed: Feed): void => {
    setEditingFeed(feed);
    setNewFeed({
      name: feed.name,
      url: feed.url,
      defaultImage: feed.default_image || ''
    });
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingFeed) return;

    const updatedFeed = {
      name: newFeed.name,
      url: newFeed.url,
      enabled: editingFeed.enabled,
      default_image: newFeed.defaultImage || null
    };

    try {
      await onEditFeed(editingFeed.id, updatedFeed);
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
    } finally {
      setEditingFeed(null);
      setNewFeed({ name: '', url: '', defaultImage: '' });
    }
  };

  const handleCancelEdit = (): void => {
    setEditingFeed(null);
    setNewFeed({ name: '', url: '', defaultImage: '' });
  };

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4 md:px-6 md:py-6">
      <div className="flex flex-col gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>RSSフィード管理</CardTitle>
            {editingFeed && (
              <CardDescription>
                「{editingFeed.name}」を編集中
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="name">フィード名</Label>
                <Input
                  id="name"
                  placeholder="例：はてなブックマーク"
                  value={newFeed.name}
                  onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">フィードURL</Label>
                <Input
                  id="url"
                  placeholder="RSSフィードのURLを入力"
                  value={newFeed.url}
                  onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>デフォルト画像</Label>
                <Select
                  value={newFeed.defaultImage}
                  onValueChange={(value) => setNewFeed({ ...newFeed, defaultImage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="画像を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {Object.entries(DEFAULT_IMAGES).map(([name, path]) => (
                      <SelectItem key={name} value={path}>
                        <div className="flex items-center gap-2">
                          <img src={path} alt={name} className="w-6 h-6" />
                          <span>{name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end space-x-2">
                {editingFeed ? (
                  <>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={!newFeed.name || !newFeed.url}
                      className="flex-1"
                    >
                      保存
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1"
                    >
                      キャンセル
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleAddNewFeed}
                    disabled={!newFeed.name || !newFeed.url}
                    className="w-full"
                  >
                    追加
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* デスクトップ向けテーブル表示 */}
        {!isMobile && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>フィード</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-[100px]">有効/無効</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeds.map((feed) => (
                    <TableRow key={feed.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {feed.default_image && (
                            <img
                              src={feed.default_image}
                              alt={feed.name}
                              className="w-6 h-6"
                            />
                          )}
                          <span>{feed.name || '名称未設定'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {feed.url}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={feed.enabled}
                          onCheckedChange={() => onToggleFeed(feed.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(feed)}
                            aria-label={`${feed.name}を編集`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteFeed(feed.id)}
                            aria-label={`${feed.name}を削除`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* モバイル向けカード表示 */}
        {isMobile && (
          <div className="space-y-3">
            {feeds.map((feed) => (
              <Card key={feed.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {feed.default_image && (
                        <img
                          src={feed.default_image}
                          alt={feed.name}
                          className="w-6 h-6"
                        />
                      )}
                      <CardTitle className="text-base">{feed.name || '名称未設定'}</CardTitle>
                    </div>
                    <Switch
                      checked={feed.enabled}
                      onCheckedChange={() => onToggleFeed(feed.id)}
                      aria-label={`${feed.name}を${feed.enabled ? '無効' : '有効'}にする`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-xs font-mono text-muted-foreground break-all">
                    {feed.url}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-0 pb-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(feed)}
                      aria-label={`${feed.name}を編集`}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      編集
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteFeed(feed.id)}
                      aria-label={`${feed.name}を削除`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      削除
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedManager; 