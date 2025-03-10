FROM public.ecr.aws/lambda/python:3.9

# 作業ディレクトリを設定
WORKDIR /var/task

# 依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# Mangumハンドラーを使用してFastAPIアプリケーションをLambdaで実行
CMD ["main.handler"] 