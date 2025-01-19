# Node.jsの公式イメージをベースとして使用
FROM node:20-slim

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# その他のソースファイルをコピー
COPY . .

# 開発サーバーのポートを開放
EXPOSE 3000

# Viteの開発サーバーをホストから接続できるように設定
ENV VITE_PORT=3000
ENV VITE_HOST=0.0.0.0

# 開発サーバー起動
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 