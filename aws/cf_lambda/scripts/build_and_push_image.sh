#!/bin/bash
set -e

# 環境変数
AWS_REGION=${AWS_REGION:-"ap-northeast-1"}
ECR_REPOSITORY_NAME="rss-feed-app-backend"
IMAGE_TAG="latest"

# 作業ディレクトリを作成
BUILD_DIR="./lambda_build"
mkdir -p $BUILD_DIR

echo "バックエンドコードを準備しています..."
# バックエンドコードをコピー
cp -r ../backend/app/* $BUILD_DIR/
cp aws/cf_lambda/lambda/main.py $BUILD_DIR/
cp aws/cf_lambda/lambda/Dockerfile $BUILD_DIR/
cp aws/cf_lambda/lambda/requirements.txt $BUILD_DIR/

# ECRリポジトリのURIを取得
ECR_REPOSITORY_URI=$(aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text 2>/dev/null || echo "")

# リポジトリが存在しない場合は作成
if [ -z "$ECR_REPOSITORY_URI" ]; then
    echo "ECRリポジトリを作成しています: $ECR_REPOSITORY_NAME"
    aws ecr create-repository --repository-name $ECR_REPOSITORY_NAME --region $AWS_REGION
    ECR_REPOSITORY_URI=$(aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text)
fi

# ECRにログイン
echo "ECRにログインしています..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI

# イメージをビルド
echo "Dockerイメージをビルドしています..."
cd $BUILD_DIR
docker build -t $ECR_REPOSITORY_URI:$IMAGE_TAG .

# イメージをプッシュ
echo "イメージをECRにプッシュしています..."
docker push $ECR_REPOSITORY_URI:$IMAGE_TAG

echo "イメージのビルドとプッシュが完了しました: $ECR_REPOSITORY_URI:$IMAGE_TAG"

# 作業ディレクトリを削除
cd ..
rm -rf $BUILD_DIR

echo "クリーンアップが完了しました。" 