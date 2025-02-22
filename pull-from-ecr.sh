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
tagId=v0.1.3

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
        echo "Pulling frontend from ECR..."
        ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rss-feed-frontend"
        docker pull ${ECR_REPO}:${tagId}
        
        echo "Tagging frontend image for local use..."
        docker tag ${ECR_REPO}:${tagId} rss-feed-frontend:${tagId}
        
        echo "Starting frontend container..."
        docker run -d -p 3000:3000 rss-feed-frontend:${tagId}
        ;;
        
    "backend")
        echo "Pulling backend from ECR..."
        ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rss-feed-backend"
        docker pull ${ECR_REPO}:${tagId}
        
        echo "Tagging backend image for local use..."
        docker tag ${ECR_REPO}:${tagId} rss-feed-backend:${tagId}
        
        echo "Starting backend container..."
        docker run -d -p 8080:8080 rss-feed-backend:${tagId}
        ;;
        
    "db")
        echo "Pulling database from ECR..."
        ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rss-feed-database"
        docker pull ${ECR_REPO}:${tagId}
        
        echo "Tagging database image for local use..."
        docker tag ${ECR_REPO}:${tagId} rss-feed-database:${tagId}
        
        echo "Starting database container..."
        docker run -d \
            -p 3306:3306 \
            -e MYSQL_ROOT_PASSWORD=rootpassword \
            -e MYSQL_DATABASE=rss_reader \
            -e MYSQL_USER=user \
            -e MYSQL_PASSWORD=password \
            --name rss-feed-database \
            rss-feed-database:${tagId} \
            --default-authentication-plugin=mysql_native_password
        ;;
        
    *)
        echo "Error: Invalid argument. Use 'frontend', 'backend' or 'db'"
        exit 1
        ;;
esac

echo "Container started successfully. Use 'docker ps' to check the status."
# イメージも削除する場合
# docker rmi rss-feed-frontend:v0.1.1
