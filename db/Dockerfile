FROM mysql:8.0

# 環境変数の設定
ENV MYSQL_ROOT_PASSWORD=rootpassword
ENV MYSQL_DATABASE=rss_reader
ENV MYSQL_USER=user
ENV MYSQL_PASSWORD=password

# カスタム設定ファイルをコピー
COPY ./my.cnf /etc/mysql/conf.d/my.cnf

# 全インターフェイスからの接続を許可
CMD ["mysqld", "--bind-address=0.0.0.0"] 