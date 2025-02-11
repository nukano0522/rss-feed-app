# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 状態管理について 例：お気に入り記事
1. ユーザーがお気に入りボタンをクリック
2. toggleFavorite関数が呼び出される
3. APIリクエストが実行される
4. 状態が更新される（setFavoriteArticles）
5. 更新された状態が関連コンポーネントに反映される

```mermaid
graph TD
    A[useRssFeed Hook]
    B[RssFeedReader]
    C1[Navigation]
    C2[ArticleList]
    D[Article Card with Star Button]

    %% データの流れ
    A -->|"state: favoriteArticles[]"| B
    A -->|"function: toggleFavorite"| B
    
    B -->|"prop: selectedMenu"| C1
    B -->|"prop: onMenuSelect"| C1
    
    B -->|"props: articles, favoriteArticles"| C2
    B -->|"prop: onToggleFavorite"| C2
    
    C2 -->|"props: article, isFavorite"| D
    C2 -->|"prop: onToggleFavorite"| D
    
    %% ユーザーアクション
    D -->|"click: toggleFavorite(article)"| A

    style A fill:#e1f5fe,stroke:#01579b
    style B fill:#e8f5e9,stroke:#2e7d32
    style C1 fill:#fff3e0,stroke:#ef6c00
    style C2 fill:#fff3e0,stroke:#ef6c00
    style D fill:#fff3e0,stroke:#ef6c00
```