from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    CfnOutput,
)
from aws_cdk.aws_elasticloadbalancingv2_targets import InstanceTarget  # 追加
from constructs import Construct


class RssFeedStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPCの作成
        vpc = ec2.Vpc(
            self,
            "RssFeedVPC",
            max_azs=2,
            nat_gateways=1,
        )

        # セキュリティグループの作成
        security_group = ec2.SecurityGroup(
            self,
            "RssFeedSecurityGroup",
            vpc=vpc,
            description="Security group for RSS Feed App",
            allow_all_outbound=True,
        )

        # インバウンドルールの追加
        security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(22), "Allow SSH access"
        )
        security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "Allow HTTP access"
        )
        security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(3000), "Allow Frontend access"
        )
        security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(8000), "Allow Backend access"
        )

        # EC2インスタンスの作成
        instance = ec2.Instance(
            self,
            "RssFeedInstance",
            vpc=vpc,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T2, ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=security_group,
            key_pair=ec2.KeyPair.from_key_pair_name(
                self, "ImportedKeyPair", "rss-feed-app-02"
            ),  # 既存のキーペアを使用
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),  # パブリックサブネットに配置
        )

        # ユーザーデータの設定
        instance.user_data.add_commands(
            # システム更新および基本パッケージのインストール
            "yum update -y",
            "yum install -y docker git",
            "systemctl start docker",
            "systemctl enable docker",
            "usermod -a -G docker ec2-user",
            # Node.js のセットアップ（例: Node.js 18.x のインストール）
            "curl -sL https://rpm.nodesource.com/setup_18.x | bash -",
            "yum install -y nodejs",
            # docker-compose v2 のセットアップ
            "mkdir -p /usr/local/lib/docker/cli-plugins/",
            "curl -SL https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose",
            "chmod +x /usr/local/lib/docker/cli-plugins/docker-compose",
            # git clone および npm install の実行（例: ec2-user のホームディレクトリ直下にクローン）
            "sudo -i -u ec2-user bash -c 'cd ~ && git clone https://github.com/nukano0522/rss-feed-app && cd rss-feed-app/frontend && npm install'",
        )

        # Application Load Balancerの作成
        alb = elbv2.ApplicationLoadBalancer(
            self,
            "RssFeedALB",
            vpc=vpc,
            internet_facing=True,
            security_group=security_group,
        )

        # リスナーとターゲットグループの作成
        listener = alb.add_listener(
            "Listener",
            port=80,
            open=True,
            default_action=elbv2.ListenerAction.fixed_response(
                status_code=404, content_type="text/plain", message_body="Not Found"
            ),
        )

        # フロントエンド用ターゲットグループ
        frontend_target_group = listener.add_targets(
            "FrontendTarget",
            port=3000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[InstanceTarget(instance)],  # ここを修正
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_http_codes="200",
            ),
        )

        # バックエンド用ターゲットグループ
        backend_target_group = listener.add_targets(
            "BackendTarget",
            port=8000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[InstanceTarget(instance)],  # ここを修正
            health_check=elbv2.HealthCheck(
                path="/docs",  # FastAPIのSwagger UI
                healthy_http_codes="200",
            ),
            priority=1,
            conditions=[elbv2.ListenerCondition.path_patterns(["/api/*"])],
        )

        # EC2インスタンスのパブリックIPを出力
        CfnOutput(
            self,
            "InstancePublicIP",
            value=instance.instance_public_ip,
            description="Public IP address of the EC2 instance",
        )

        # ELBのDNS名を出力
        CfnOutput(
            self,
            "LoadBalancerDNS",
            value=alb.load_balancer_dns_name,
            description="DNS name of the Load Balancer",
        )
