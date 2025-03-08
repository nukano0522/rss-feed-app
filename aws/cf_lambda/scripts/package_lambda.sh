#!/bin/bash
set -e

# 作業ディレクトリを作成
PACKAGE_DIR="../backend/lambda_package"
mkdir -p $PACKAGE_DIR

# 必要なファイルをコピー
echo "バックエンドコードをコピーしています..."
cp -r ../backend/app/* $PACKAGE_DIR/
cp aws/cf_lambda/lambda/main.py $PACKAGE_DIR/

# 仮想環境を作成
echo "仮想環境を作成しています..."
python -m venv $PACKAGE_DIR/venv
source $PACKAGE_DIR/venv/bin/activate

# 依存関係をインストール
echo "依存関係をインストールしています..."
pip install -r ../backend/requirements.txt
pip install mangum boto3

# Lambda用のパッケージをインストール
cd $PACKAGE_DIR
pip install -t . mangum boto3 fastapi pydantic uvicorn

# 不要なファイルを削除
echo "不要なファイルを削除しています..."
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type d -name "*.dist-info" -exec rm -rf {} +
find . -type d -name "*.egg-info" -exec rm -rf {} +
rm -rf venv

echo "Lambda関数のパッケージングが完了しました。" 