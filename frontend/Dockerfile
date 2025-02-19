# Node.jsの公式イメージをベースとして使用
FROM node:20-slim

# 作業ディレクトリを設定
WORKDIR /app

# npmの設定を最適化
RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-timeout 600000 \
    && npm config set registry https://registry.npmjs.org/

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# # node_modulesをクリーンアップして再インストール
# RUN rm -rf node_modules \
#     && npm cache clean --force \
#     && npm ci
# 依存関係をクリーンインストール
RUN rm -rf node_modules && \
    npm cache clean --force && \
    npm install

# ソースコードをコピー
COPY . .

# 開発サーバーのポートを開放
EXPOSE 3000

# Viteの開発サーバーをホストから接続できるように設定
ENV VITE_PORT=3000
ENV VITE_HOST=0.0.0.0

# 開発サーバー起動
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ホットリロードのためのボリュームマウント用に作業ディレクトリを指定
VOLUME ["/app/src", "/app/public"] 