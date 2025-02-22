from aws_cdk import Stack, aws_ecr as ecr, RemovalPolicy
from constructs import Construct


class ECRStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # フロントエンド用ECRリポジトリ
        self.frontend_repository = ecr.Repository(
            self,
            "FrontendRepository",
            repository_name="rss-app-frontend",
            removal_policy=RemovalPolicy.DESTROY,  # スタック削除時にリポジトリも削除
            auto_delete_images=True,  # リポジトリ削除時に全イメージを削除
        )

        # バックエンド用ECRリポジトリ
        self.backend_repository = ecr.Repository(
            self,
            "BackendRepository",
            repository_name="rss-app-backend",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_images=True,
        )
