import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Rss, FileText, Star, LogOut, Menu, X } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet"

type MenuType = 'feeds' | 'articles' | 'favorites';

interface NavigationProps {
  selectedMenu: MenuType;
  onMenuSelect: (menu: MenuType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ selectedMenu, onMenuSelect }) => {
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuClick = (menu: MenuType) => {
    onMenuSelect(menu);
    if (isMobile) {
      setIsMenuOpen(false);
    }
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6">
        <h2 className="text-lg font-semibold">RSSリーダー</h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Button
            variant={selectedMenu === 'feeds' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2 mb-2"
            onClick={() => handleMenuClick('feeds')}
            aria-label="フィード管理"
            aria-pressed={selectedMenu === 'feeds'}
          >
            <Rss className="h-4 w-4" />
            フィード管理
          </Button>
          <Button
            variant={selectedMenu === 'articles' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2 mb-2"
            onClick={() => handleMenuClick('articles')}
            aria-label="記事一覧"
            aria-pressed={selectedMenu === 'articles'}
          >
            <FileText className="h-4 w-4" />
            記事一覧
          </Button>
          <Button
            variant={selectedMenu === 'favorites' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            onClick={() => handleMenuClick('favorites')}
            aria-label="お気に入り"
            aria-pressed={selectedMenu === 'favorites'}
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
          aria-label="ログアウト"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );

  // モバイル表示
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-background border-b">
          <h2 className="text-lg font-semibold">RSSリーダー</h2>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="メニュー">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
        <div className="h-[60px]"></div> {/* ヘッダーの高さ分のスペーサー */}
      </>
    );
  }

  // デスクトップ表示
  return (
    <div className="hidden md:block w-[240px] border-r h-screen">
      <NavContent />
    </div>
  );
};

export default Navigation; 