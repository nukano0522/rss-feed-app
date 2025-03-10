#!/usr/bin/env python3
import os
from aws_cdk import App, Environment
from stacks.frontend_stack import FrontendStack
from stacks.backend_stack import BackendStack
from stacks.database_stack import DatabaseStack

app = App()

# 環境変数から取得するか、デフォルト値を使用
account = os.environ.get("CDK_DEFAULT_ACCOUNT", "")
region = os.environ.get("CDK_DEFAULT_REGION", "ap-northeast-1")

env = Environment(account=account, region=region)

# ドメイン設定
domain_name = "app.nklifehub.com"  # カスタムドメイン
certificate_arn = os.environ.get("CERTIFICATE_ARN", "")  # ACM証明書ARN

# スタックの作成
database_stack = DatabaseStack(app, "RssFeedAppDatabaseStack", env=env)

backend_stack = BackendStack(
    app,
    "RssFeedAppBackendStack",
    domain_name=domain_name,
    certificate_arn=certificate_arn,
    dynamodb_table=database_stack.table,
    env=env,
)

frontend_stack = FrontendStack(
    app,
    "RssFeedAppFrontendStack",
    domain_name=domain_name,
    certificate_arn=certificate_arn,
    api_url=backend_stack.api_url,
    env=env,
)

# タグの追加
for stack in [database_stack, backend_stack, frontend_stack]:
    app.tags.set_tag("Project", "RssFeedApp")
    app.tags.set_tag("Environment", "Production")

app.synth()
