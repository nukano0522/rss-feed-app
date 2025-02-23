#!/usr/bin/env python3
import os
import subprocess
import json
from aws_cdk import App, Environment
from stacks.rds_stack import RdsStack

# AWS認証情報を環境変数から取得
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION", "ap-northeast-1")


# AWSアカウントIDを取得
def get_aws_account_id():
    try:
        cmd = ["aws", "sts", "get-caller-identity", "--output", "json"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return json.loads(result.stdout)["Account"]
    except Exception as e:
        print(f"Error getting AWS account ID: {e}")
        return None


app = App()

# 環境変数の設定
env = Environment(account=get_aws_account_id(), region=AWS_DEFAULT_REGION)

# 既存のVPCとECSセキュリティグループのIDを指定
VPC_ID = "vpc-01bb5c61ac867a591"  # 既存のVPC ID
ECS_SG_ID = "sg-00c6f726365cf9995"  # ECSのセキュリティグループID

RdsStack(
    app, "RSSReaderRDSStack", vpc_id=VPC_ID, ecs_security_group_id=ECS_SG_ID, env=env
)

app.synth()
