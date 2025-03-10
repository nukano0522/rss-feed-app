from aws_cdk import (
    Stack,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_certificatemanager as acm,
    aws_iam as iam,
    aws_dynamodb as dynamodb,
    aws_logs as logs,
    aws_ecr as ecr,
    Duration,
    CfnOutput,
)
from constructs import Construct
import os


class BackendStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        domain_name: str,
        certificate_arn: str,
        dynamodb_table: dynamodb.Table,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # API用のサブドメイン
        api_domain_name = (
            f"api.{'.'.join(domain_name.split('.')[-2:])}"  # 例: api.nklifehub.com
        )

        # ACM証明書の参照
        certificate = acm.Certificate.from_certificate_arn(
            self, "Certificate", certificate_arn
        )

        # Lambda実行ロールの作成
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        # DynamoDBへのアクセス権限を追加
        dynamodb_table.grant_read_write_data(lambda_role)

        # ECRリポジトリの参照（既存のリポジトリを使用）
        repository = ecr.Repository.from_repository_name(
            self,
            "BackendRepository",
            repository_name="rss-feed-backend",  # ECRリポジトリ名
        )

        # Lambda関数の作成（コンテナイメージを使用）
        backend_lambda = lambda_.DockerImageFunction(
            self,
            "BackendFunction",
            code=lambda_.DockerImageCode.from_ecr(
                repository=repository, tag="latest"  # 使用するイメージタグ
            ),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=1024,  # コンテナイメージ用にメモリを増やす
            environment={
                "DYNAMODB_TABLE": dynamodb_table.table_name,
                "ENVIRONMENT": "production",
                "DOMAIN": domain_name,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # API Gatewayの作成
        api = apigw.LambdaRestApi(
            self,
            "BackendApi",
            handler=backend_lambda,
            proxy=True,  # すべてのリクエストをLambdaに転送
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
            ),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=[
                    "Content-Type",
                    "Authorization",
                    "X-Amz-Date",
                    "X-Api-Key",
                ],
                allow_credentials=True,
            ),
        )

        # カスタムドメインの設定
        domain = apigw.DomainName(
            self,
            "ApiDomain",
            domain_name=api_domain_name,
            certificate=certificate,
            security_policy=apigw.SecurityPolicy.TLS_1_2,
            endpoint_type=apigw.EndpointType.EDGE,
        )

        # ベースパスマッピング
        domain.add_base_path_mapping(
            api,
            stage=api.deployment_stage,
        )

        # Route 53 ホストゾーンの取得
        hosted_zone = route53.HostedZone.from_lookup(
            self,
            "HostedZone",
            domain_name=".".join(domain_name.split(".")[-2:]),  # 例: nklifehub.com
        )

        # Route 53 レコードの作成
        route53.ARecord(
            self,
            "ApiAliasRecord",
            zone=hosted_zone,
            record_name="api",  # api.nklifehub.com
            target=route53.RecordTarget.from_alias(targets.ApiGatewayDomain(domain)),
        )

        # 出力
        self.api_url = f"https://{api_domain_name}"
        CfnOutput(self, "ApiURL", value=self.api_url)
        CfnOutput(self, "ApiId", value=api.rest_api_id)
