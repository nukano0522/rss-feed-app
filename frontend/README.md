# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 状態管理
## お気に入り記事
1. 初期ロード時にAPIからお気に入り記事を取得
2. ユーザーのお気に入りボタンクリックでtoggleFavorite関数が実行
3. APIを通じてデータベースが更新
4. 更新結果を元に状態（favoriteArticles, favoriteArticlesList）を更新
5. 更新された状態がUIに反映
```mermaid
graph TD
    %% コンポーネントとフック
    Hook[useRssFeed Hook]
    ArticleList[ArticleList Component]
    Card[Article Card]
    API[Feeds API]
    DB[(Database)]

    %% 状態
    State1[favoriteArticles]
    State2[favoriteArticlesList]

    %% 1. お気に入り記事の初期取得
    API -->|getFavoriteArticles| DB
    DB -->|記事データ| API
    API -->|response.data| Hook
    Hook -->|setFavoriteArticles| State1
    Hook -->|setFavoriteArticlesList| State2
    State1 -->|prop: favoriteArticles| ArticleList
    ArticleList -->|prop: favoriteArticles| Card

    %% 2. お気に入り登録/解除
    Card -->|handleToggleFavorite| ArticleList
    ArticleList -->|onToggleFavorite| Hook
    Hook -->|addFavoriteArticle/removeFavoriteArticle| API
    API -->|DB操作| DB
    DB -->|更新結果| API
    API -->|response| Hook
    Hook -->|状態更新| State1
    Hook -->|状態更新| State2

    %% スタイル
    classDef component fill:#e1f5fe,stroke:#01579b
    classDef state fill:#e8f5e9,stroke:#2e7d32
    classDef api fill:#fff3e0,stroke:#ef6c00
    classDef database fill:#fce4ec,stroke:#c2185b

    class Hook,ArticleList,Card component
    class State1,State2 state
    class API api
    class DB database
```

# ルーティング
## 開発環境
```mermaid
sequenceDiagram
  participant B as Browser
  participant V as Vite Dev Server
  participant P as Proxy Middleware
  participant BE as Backend API

  B->>V: GET /api/v1/hoge
  V->>P: リクエストパスのチェック (/api/v1にマッチ)
  P->>P: rewrite関数実行<br>(例: path.replace(/^\/api\/v1/, '/api/v1'))
  P->>BE: 書き換え後のリクエストを転送<br>(http://backend:8000/api/v1/hoge)
  BE-->>P: APIレスポンス
  P-->>V: レスポンス転送
  V-->>B: ブラウザへレスポンス返却
```
## 本番環境
```mermaid
graph LR
    Browser[ブラウザ]
    Nginx[Nginx\nport:3000]
    Backend[バックエンド\nport:8000]
    
    Browser -->|1.静的ファイル要求\n/index.html| Nginx
    Browser -->|2.API要求\n/api/v1/feeds| Nginx
    Nginx -->|3.静的ファイル応答\n/usr/share/nginx/html| Browser
    Nginx -->|4.プロキシ転送backend:8000/api/v1/feeds| Backend
    Backend -->|5.レスポンス| Nginx
    Nginx -->|6.レスポンス| Browser
```


