import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Rss, FileText, Star, LogOut } from "lucide-react"

type MenuType = 'feeds' | 'articles' | 'favorites';

interface NavigationProps {
  selectedMenu: MenuType;
  onMenuSelect: (menu: MenuType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ selectedMenu, onMenuSelect }) => {
  const { logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="w-[240px] border-r h-screen">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-lg font-semibold">RSSリーダー</h2>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-4">
            <Button
              variant={selectedMenu === 'feeds' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2 mb-2"
              onClick={() => onMenuSelect('feeds')}
            >
              <Rss className="h-4 w-4" />
              フィード管理
            </Button>
            <Button
              variant={selectedMenu === 'articles' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2 mb-2"
              onClick={() => onMenuSelect('articles')}
            >
              <FileText className="h-4 w-4" />
              記事一覧
            </Button>
            <Button
              variant={selectedMenu === 'favorites' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => onMenuSelect('favorites')}
            >
              <Star className="h-4 w-4" />
              お気に入り
            </Button>
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navigation; 