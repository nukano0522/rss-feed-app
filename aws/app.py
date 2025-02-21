#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.rss_feed_stack import RssFeedStack

app = cdk.App()
RssFeedStack(
    app,
    "RssFeedAppStack",
    env=cdk.Environment(
        account="584575096038",  # 実際のAWSアカウントID
        region="ap-northeast-1",  # 東京リージョン
    ),
)

app.synth()
