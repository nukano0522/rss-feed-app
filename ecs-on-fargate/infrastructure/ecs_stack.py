from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ecr as ecr,
    aws_secretsmanager as secretsmanager,
    aws_elasticloadbalancingv2 as elbv2,
    aws_efs as efs,
    RemovalPolicy,
)
from constructs import Construct


class ECSStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        frontend_repository: ecr.Repository,
        backend_repository: ecr.Repository,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ECSクラスターの作成
        cluster = ecs.Cluster(self, "RSSAppCluster", vpc=vpc, container_insights=True)

        # データベースのクレデンシャルをSecretsManagerで管理
        database_secret = secretsmanager.Secret(
            self,
            "DBSecret",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "admin", "database": "rss_reader"}',
                generate_string_key="password",
                exclude_characters='"@/\\',
            ),
        )

        # EFSファイルシステムの作成（MySQLデータの永続化用）
        fs = efs.FileSystem(
            self, "MySQLFileSystem", vpc=vpc, removal_policy=RemovalPolicy.DESTROY
        )

        # タスク実行用のIAMロールにSecretsManagerへのアクセス権を追加
        task_execution_role = ecs.TaskDefinition.new_execution_role(
            self, "TaskExecutionRole", role_name="RSSAppTaskExecutionRole"
        )
        database_secret.grant_read(task_execution_role)

        # MySQLコンテナ用のタスク定義
        mysql_task = ecs.FargateTaskDefinition(
            self, "MySQLTask", cpu=512, memory_limit_mib=1024
        )

        # EFSボリュームの追加
        mysql_volume = ecs.Volume(
            name="mysql_data",
            efs_volume_configuration=ecs.EfsVolumeConfiguration(
                file_system_id=fs.file_system_id
            ),
        )
        mysql_task.add_volume(mysql_volume)

        # MySQLコンテナの定義
        mysql_container = mysql_task.add_container(
            "MySQLContainer",
            image=ecs.ContainerImage.from_registry("mysql:8.0"),
            environment={"MYSQL_DATABASE": "rss_reader"},
            secrets={
                "MYSQL_USER": ecs.Secret.from_secrets_manager(
                    database_secret, "username"
                ),
                "MYSQL_PASSWORD": ecs.Secret.from_secrets_manager(
                    database_secret, "password"
                ),
                "MYSQL_ROOT_PASSWORD": ecs.Secret.from_secrets_manager(
                    database_secret, "password"
                ),
            },
            logging=ecs.LogDriver.aws_logs(stream_prefix="mysql"),
        )
        mysql_container.add_mount_points(
            ecs.MountPoint(
                container_path="/var/lib/mysql",
                source_volume="mysql_data",
                read_only=False,
            )
        )
        mysql_container.add_port_mappings(ecs.PortMapping(container_port=3306))

        # MySQLサービスの作成
        mysql_service = ecs.FargateService(
            self,
            "MySQLService",
            cluster=cluster,
            task_definition=mysql_task,
            desired_count=1,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        # フロントエンド用のFargateサービス
        frontend_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            "FrontendService",
            cluster=cluster,
            cpu=256,
            memory_limit_mib=512,
            desired_count=2,
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_ecr_repository(frontend_repository),
                container_port=3000,
                environment={"NODE_ENV": "production"},
            ),
            public_load_balancer=True,
            assign_public_ip=True,
        )

        # バックエンド用のFargateサービス
        backend_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            "BackendService",
            cluster=cluster,
            cpu=512,
            memory_limit_mib=1024,
            desired_count=2,
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_ecr_repository(backend_repository),
                container_port=8000,
                environment={
                    "DATABASE_URL": f"mysql://{{resolve:secretsmanager:{database_secret.secret_arn}:SecretString:username}}:{{resolve:secretsmanager:{database_secret.secret_arn}:SecretString:password}}@{mysql_service.service.cluster_ip}/rss_reader"
                },
                secrets={
                    "OPENAI_API_KEY": ecs.Secret.from_secrets_manager(
                        database_secret, "openai_api_key"
                    )
                },
            ),
            public_load_balancer=True,
            assign_public_ip=True,
        )

        # フロントエンドのスケーリング設定
        frontend_scaling = frontend_service.service.auto_scale_task_count(
            max_capacity=4, min_capacity=2
        )
        frontend_scaling.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            scale_in_cooldown=ecs.Duration.seconds(60),
            scale_out_cooldown=ecs.Duration.seconds(60),
        )

        # バックエンドのスケーリング設定
        backend_scaling = backend_service.service.auto_scale_task_count(
            max_capacity=4, min_capacity=2
        )
        backend_scaling.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            scale_in_cooldown=ecs.Duration.seconds(60),
            scale_out_cooldown=ecs.Duration.seconds(60),
        )

        # ヘルスチェックの設定
        frontend_service.target_group.configure_health_check(
            path="/",
            healthy_http_codes="200",
            interval=ecs.Duration.seconds(30),
            timeout=ecs.Duration.seconds(5),
        )

        backend_service.target_group.configure_health_check(
            path="/health",
            healthy_http_codes="200",
            interval=ecs.Duration.seconds(30),
            timeout=ecs.Duration.seconds(5),
        )

        # MySQLサービスへのアクセスを許可
        mysql_service.connections.allow_from(
            backend_service.service,
            port_range=ec2.Port.tcp(3306),
            description="Allow MySQL access from backend",
        )
