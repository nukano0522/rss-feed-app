# Python 3.11をベースイメージとして使用
FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# MySQLクライアントのインストール
RUN apt-get update && \
    apt-get install -y default-libmysqlclient-dev pkg-config build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 必要なパッケージをインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコードをコピー
COPY ./app ./app
COPY .env.development ./.env

# 環境変数を設定
ENV PYTHONPATH=/app

# バックアップディレクトリの作成
RUN mkdir -p /app/data/dynamodb_backup && \
    chmod -R 777 /app/data

# FastAPIアプリケーションを起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]