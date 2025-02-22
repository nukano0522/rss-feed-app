from aws_cdk import Stack, aws_ec2 as ec2
from constructs import Construct


class VPCStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPCの作成
        self.vpc = ec2.Vpc(
            self,
            "RSSAppVPC",
            max_azs=2,  # 2つのアベイラビリティーゾーンを使用
            nat_gateways=1,  # コスト削減のため1つのNATゲートウェイを使用
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public", subnet_type=ec2.SubnetType.PUBLIC, cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # VPCエンドポイントの作成
        self.vpc.add_gateway_endpoint(
            "S3Endpoint", service=ec2.GatewayVpcEndpointAwsService.S3
        )

        self.vpc.add_interface_endpoint(
            "ECREndpoint", service=ec2.InterfaceVpcEndpointAwsService.ECR
        )

        self.vpc.add_interface_endpoint(
            "ECRDockerEndpoint", service=ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER
        )

        self.vpc.add_interface_endpoint(
            "CloudWatchLogsEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        )

        self.vpc.add_interface_endpoint(
            "SecretsManagerEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        )
