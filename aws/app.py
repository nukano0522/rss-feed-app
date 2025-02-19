#!/usr/bin/env python3
from aws_cdk import App
from stacks.rss_feed_stack import RssFeedStack

app = App()
RssFeedStack(app, "RssFeedAppStack", env={"region": "ap-northeast-1"})  # 東京リージョン

app.synth()
