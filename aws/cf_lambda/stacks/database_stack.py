from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct


class DatabaseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # DynamoDBテーブルの作成
        self.table = dynamodb.Table(
            self,
            "RssFeedTable",
            partition_key=dynamodb.Attribute(
                name="PK", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(name="SK", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # オンデマンドキャパシティモード
            removal_policy=RemovalPolicy.RETAIN,  # 本番環境では誤削除防止のため保持
            point_in_time_recovery=True,  # ポイントインタイムリカバリを有効化
        )

        # GSI: ユーザーIDによるインデックス
        self.table.add_global_secondary_index(
            index_name="UserIdIndex",
            partition_key=dynamodb.Attribute(
                name="UserId", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(name="SK", type=dynamodb.AttributeType.STRING),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # GSI: フィードURLによるインデックス
        self.table.add_global_secondary_index(
            index_name="FeedUrlIndex",
            partition_key=dynamodb.Attribute(
                name="FeedUrl", type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # GSI: 記事リンクによるインデックス
        self.table.add_global_secondary_index(
            index_name="ArticleLinkIndex",
            partition_key=dynamodb.Attribute(
                name="ArticleLink", type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # 出力
        CfnOutput(self, "TableName", value=self.table.table_name)
        CfnOutput(self, "TableArn", value=self.table.table_arn)
