# CloudFront + Lambda (コンテナイメージ) RSSフィードアプリケーション

このプロジェクトは、AWSのCloudFrontとLambda（コンテナイメージ）を利用したサーバーレスアーキテクチャでRSSフィードアプリケーションをデプロイするためのCDKコードです。

## アーキテクチャ
```mermaid
graph TD
    User[ユーザー] -->|HTTPS| CloudFront[CloudFront\nディストリビューション]
    
    subgraph "フロントエンド"
        CloudFront -->|静的コンテンツ配信| S3[S3バケット\napp.nklifehub.com]
        S3 -->|ホスティング| ReactApp[Reactアプリケーション\nビルドファイル]
    end
    
    subgraph "バックエンド"
        ReactApp -->|API呼び出し| LambdaURL[Lambda URL\nnif25kbz33nddigdxssa2evuta0ynhal.lambda-url.ap-northeast-1.on.aws]
        LambdaURL -->|リクエスト転送| Lambda[Lambda関数\nFastAPI]
        Lambda -->|データ操作| RDS[Amazon RDS\nMySQL/PostgreSQL]
    end
    
    subgraph "CORS設定"
        Lambda -->|allow_origins| CORS["CORSMiddleware\nallow_origins=['https://s3app.nklifehub.com']"]
    end
    
    subgraph "ルーティング"
        Lambda -->|include_router| APIRouter["/api/v1\napi_router"]
        APIRouter -->|ルート| AuthRoutes[認証ルート\n/auth/jwt/login\n/auth/jwt/logout\n/auth/register]
        APIRouter -->|ルート| UserRoutes[ユーザールート\n/users/me]
        APIRouter -->|ルート| FeedRoutes[フィードルート\n/feeds\n/feeds/articles\n/feeds/favorites]
    end
    
    subgraph "DNS設定"
        DNS[Route 53] -->|DNSレコード| CloudFrontDomain[s3app.nklifehub.com]
        CloudFrontDomain --> CloudFront
    end
    
    classDef aws fill:#FF9900,stroke:#232F3E,color:white;
    classDef frontend fill:#1E88E5,stroke:#0D47A1,color:white;
    classDef backend fill:#43A047,stroke:#1B5E20,color:white;
    classDef routing fill:#8E24AA,stroke:#4A148C,color:white;
    
    class CloudFront,S3,Lambda,RDS,DNS aws;
    class ReactApp,CloudFrontDomain frontend;
    class LambdaURL,CORS backend;
    class APIRouter,AuthRoutes,UserRoutes,FeedRoutes routing;
    ```