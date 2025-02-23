#!/bin/bash

# AWS認証情報を環境変数から取得
AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)
AWS_REGION=$(aws configure get region)

# AWSアカウントIDを取得
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
    echo "Error: AWSアカウントIDの取得に失敗しました"
    exit 1
fi

# 環境変数の確認
echo "Using AWS Account ID: ${AWS_ACCOUNT_ID}"
echo "Using AWS Region: ${AWS_REGION}"

# タグIDの設定
tagId=v0.1.8

# ECRへのログイン
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# 引数チェック
if [ $# -ne 1 ]; then
    echo "Usage: $0 <frontend|backend|db>"
    echo "Example: $0 frontend"
    exit 1
fi

# 引数による処理分岐
case $1 in
    "frontend")
        echo "Building and pushing frontend..."
        docker build \
            -t rss-feed-frontend \
            -f ./frontend/Dockerfile ./frontend

        docker tag rss-feed-frontend ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rss-feed-frontend:${tagId}
        docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rss-feed-frontend:${tagId}
        ;;
        
    "backend")
        echo "Building and pushing backend..."
        docker build \
            -t rss-feed-backend \
            -f ./backend/Dockerfile ./backend

        docker tag rss-feed-backend ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rss-feed-backend:${tagId}
        docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rss-feed-backend:${tagId}
        ;;
        
    "db")
        echo "Building and pushing database..."
        docker build \
            -t rss-feed-database \
            -f ./db/Dockerfile ./db
        
        # ECRにプッシュするためのタグ付け
        docker tag rss-feed-database ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rss-feed-database:${tagId}
        
        # ECRにプッシュ
        docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rss-feed-database:${tagId}
        ;;
        
    *)
        echo "Error: Invalid argument. Use 'frontend', 'backend' or 'db'"
        exit 1
        ;;
esac

