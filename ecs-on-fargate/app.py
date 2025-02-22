#!/usr/bin/env python3
import os
from aws_cdk import App, Environment
from infrastructure.vpc_stack import VPCStack
from infrastructure.ecr_stack import ECRStack
from infrastructure.ecs_stack import ECSStack

app = App()

# 環境変数の設定
env = Environment(
    account=os.getenv("CDK_DEFAULT_ACCOUNT"),
    region=os.getenv("CDK_DEFAULT_REGION", "ap-northeast-1"),
)

# VPCスタックの作成
vpc_stack = VPCStack(app, "RSSAppVPCStack", env=env)

# ECRスタックの作成
ecr_stack = ECRStack(app, "RSSAppECRStack", env=env)

# ECSスタックの作成
ecs_stack = ECSStack(
    app,
    "RSSAppECSStack",
    vpc=vpc_stack.vpc,
    frontend_repository=ecr_stack.frontend_repository,
    backend_repository=ecr_stack.backend_repository,
    env=env,
)
ecs_stack.add_dependency(vpc_stack)
ecs_stack.add_dependency(ecr_stack)

app.synth()
