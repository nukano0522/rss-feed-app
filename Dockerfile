# Node.jsの公式イメージをベースとして使用
FROM node:20-slim

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# Viteのデフォルトポートを開放
EXPOSE 5173

# 開発サーバーを起動
CMD ["npm", "run", "dev"] 