from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_s3_deployment as s3deploy,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_certificatemanager as acm,
    CfnOutput,
    RemovalPolicy,
)
from constructs import Construct
import os


class FrontendStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        domain_name: str,
        certificate_arn: str,
        api_url: str,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3バケットの作成（静的ウェブサイトホスティング用）
        website_bucket = s3.Bucket(
            self,
            "WebsiteBucket",
            bucket_name=f"{domain_name.replace('.', '-')}-website",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # 開発環境では削除可能に設定
            auto_delete_objects=True,  # スタック削除時にオブジェクトも削除
        )

        # CloudFrontのオリジンアクセスアイデンティティ
        origin_access_identity = cloudfront.OriginAccessIdentity(
            self, "OriginAccessIdentity", comment=f"OAI for {domain_name} website"
        )

        # S3バケットポリシーの設定
        website_bucket.grant_read(origin_access_identity)

        # ACM証明書の参照
        certificate = acm.Certificate.from_certificate_arn(
            self, "Certificate", certificate_arn
        )

        # CloudFrontディストリビューションの作成
        distribution = cloudfront.Distribution(
            self,
            "Distribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(
                    website_bucket, origin_access_identity=origin_access_identity
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
            ),
            domain_names=[domain_name],
            certificate=certificate,
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",  # SPAのためのエラーハンドリング
                ),
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",  # SPAのためのエラーハンドリング
                ),
            ],
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
            "AliasRecord",
            zone=hosted_zone,
            record_name=domain_name.split(".")[0],  # 例: app
            target=route53.RecordTarget.from_alias(
                targets.CloudFrontTarget(distribution)
            ),
        )

        # S3へのデプロイ設定
        # ビルド済みのReactアプリをデプロイ
        s3deploy.BucketDeployment(
            self,
            "DeployWebsite",
            sources=[
                s3deploy.Source.asset("../frontend/dist")
            ],  # ビルド済みのReactアプリのパス
            destination_bucket=website_bucket,
            distribution=distribution,
            distribution_paths=["/*"],  # キャッシュの無効化
        )

        # 出力
        CfnOutput(self, "WebsiteURL", value=f"https://{domain_name}")
        CfnOutput(self, "DistributionId", value=distribution.distribution_id)
        CfnOutput(self, "BucketName", value=website_bucket.bucket_name)
