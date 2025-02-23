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

# 環境変数を設定
ENV PYTHONPATH=/app
ENV OPENAI_API_KEY=xxxx-xxxx-xxxx-xxxx
# ENV DATABASE_URL=mysql://user:password@db:3306/rss_reader
ENV DATABASE_URL=mysql+aiomysql://admin:4Cxr%3E%7C.0IPX%24kgETE%21y1.o%2B4d%2AmkS%3B%5Em@rssreaderrdsstack-rssreaderdatabase47848f56-ceihboypn9u7.cv6uaugkqe8s.ap-northeast-1.rds.amazonaws.com:3306/rss_reader

# FastAPIアプリケーションを起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]