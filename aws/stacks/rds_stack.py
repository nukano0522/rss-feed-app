from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class RdsStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc_id: str,
        ecs_security_group_id: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # 既存のVPCを参照
        vpc = ec2.Vpc.from_lookup(self, "ExistingVPC", vpc_id=vpc_id)

        # RDS用のセキュリティグループを作成
        db_security_group = ec2.SecurityGroup(
            self,
            "RDSSecurityGroup",
            vpc=vpc,
            description="Security group for RDS MySQL",
            security_group_name="rss-reader-rds-sg",
        )

        # ECSのセキュリティグループからのアクセスを許可
        ecs_security_group = ec2.SecurityGroup.from_security_group_id(
            self, "ECSSecurityGroup", security_group_id=ecs_security_group_id
        )
        db_security_group.add_ingress_rule(
            peer=ecs_security_group,
            connection=ec2.Port.tcp(3306),
            description="Allow MySQL access from ECS",
        )

        # データベースのクレデンシャルをSecretsManagerで管理
        database_secret = secretsmanager.Secret(
            self,
            "RDSSecret",
            secret_name="rss-reader-db-credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "admin"}',
                generate_string_key="password",
                exclude_characters='"@/\\',
            ),
        )

        # RDSインスタンスの作成
        self.database = rds.DatabaseInstance(
            self,
            "RSSReaderDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0
            ),
            # db.t3.micro
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[db_security_group],
            allocated_storage=20,
            max_allocated_storage=100,
            removal_policy=RemovalPolicy.RETAIN,  # 本番環境では誤削除を防ぐため
            deletion_protection=True,  # 本番環境では有効化を推奨
            database_name="rss_reader",
            credentials=rds.Credentials.from_secret(database_secret),
            backup_retention=Duration.days(7),
            parameter_group=rds.ParameterGroup(
                self,
                "RSSReaderDBParameterGroup",
                engine=rds.DatabaseInstanceEngine.mysql(
                    version=rds.MysqlEngineVersion.VER_8_0
                ),
                parameters={
                    "character_set_server": "utf8mb4",
                    "collation_server": "utf8mb4_unicode_ci",
                },
            ),
            monitoring_interval=Duration.minutes(1),
            enable_performance_insights=False,
        )
