# CloudFront + Lambda (コンテナイメージ) RSSフィードアプリケーション

このプロジェクトは、AWSのCloudFrontとLambda（コンテナイメージ）を利用したサーバーレスアーキテクチャでRSSフィードアプリケーションをデプロイするためのCDKコードです。

## アーキテクチャ

![アーキテクチャ図](architecture.png)

- **フロントエンド**: Reactアプリのビルド成果物をS3バケットに配置し、CloudFront経由で配信
- **バックエンド**: FastAPIアプリケーションをECRコンテナイメージとしてLambda関数にデプロイし、API Gateway経由で公開
- **データベース**: DynamoDBを使用してデータを保存

## 前提条件

- AWS CLIがインストールされ、適切に設定されていること
- Python 3.9以上がインストールされていること
- Node.js 14以上がインストールされていること
- AWS CDK v2がインストールされていること
- Dockerがインストールされ、実行可能であること
- ACM証明書が取得済みであること
- Route 53でドメインが設定済みであること

## セットアップ手順

### 1. 依存関係のインストール

```bash
# CDKの依存関係をインストール
cd aws/cf_lambda
pip install -r requirements.txt

# フロントエンドのビルド
cd ../../frontend
npm install
npm run build
```

### 2. バックエンドコンテナイメージのビルドとプッシュ

```bash
cd ../aws/cf_lambda
chmod +x scripts/build_and_push_image.sh
./scripts/build_and_push_image.sh
```

### 3. CDKのデプロイ

```bash
# 環境変数の設定
export CERTIFICATE_ARN=<ACM証明書のARN>
export AWS_REGION=ap-northeast-1  # 使用するリージョン

# CDKのブートストラップ（初回のみ）
cdk bootstrap

# デプロイ
cdk deploy --all
```

## スタックの説明

- **RssFeedAppDatabaseStack**: DynamoDBテーブルを作成します
- **RssFeedAppBackendStack**: Lambda関数（コンテナイメージ）とAPI Gatewayを作成します
- **RssFeedAppFrontendStack**: S3バケットとCloudFrontディストリビューションを作成します

## コンテナイメージの更新

バックエンドのコードを変更した場合は、以下の手順でコンテナイメージを更新します：

1. コードを変更する
2. イメージをビルドしてプッシュする：
   ```bash
   ./scripts/build_and_push_image.sh
   ```
3. Lambda関数を更新する：
   ```bash
   cdk deploy RssFeedAppBackendStack
   ```

## カスタマイズ

- `app.py`の`domain_name`変数を変更して、カスタムドメインを設定できます
- 環境変数`CERTIFICATE_ARN`を設定して、ACM証明書のARNを指定します
- `scripts/build_and_push_image.sh`の`ECR_REPOSITORY_NAME`変数を変更して、ECRリポジトリ名をカスタマイズできます

## 注意事項

- 本番環境では、セキュリティを強化するために追加の設定が必要な場合があります
- DynamoDBテーブルは、スタックを削除しても保持されるように設定されています（`RemovalPolicy.RETAIN`）
- CloudFrontディストリビューションの作成と削除には時間がかかる場合があります
- Lambda関数のコンテナイメージサイズは10GBまでに制限されています

## トラブルシューティング

- CloudFrontのキャッシュに関する問題が発生した場合は、キャッシュを無効化してください
- Lambda関数のログはCloudWatchで確認できます
- API Gatewayのログも有効になっているため、問題が発生した場合はそちらも確認してください
- コンテナイメージのビルドやプッシュに問題がある場合は、AWS CLIの設定とDockerの動作を確認してください 