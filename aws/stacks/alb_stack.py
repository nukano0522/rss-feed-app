from aws_cdk import aws_elasticloadbalancingv2 as elasticloadbalancingv2, core as cdk


class NkLoadBalancerStack(cdk.Stack):
    def __init__(
        self,
        scope: cdk.Construct,
        id: str,
        vpc_id: str,
        ecs_security_group_id: str,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        elasticloadbalancingv2loadbalancer = elasticloadbalancingv2.CfnLoadBalancer(
            self,
            "ElasticLoadBalancingV2LoadBalancer",
            name="ALB-NK-LIFEHUB-01",
            scheme="internet-facing",
            type="application",
            subnets=["subnet-005c379018a109931", "subnet-031d442c05e47129f"],
            security_groups=["sg-0bc094ce423923264"],
            ip_address_type="ipv4",
            load_balancer_attributes=[
                {"key": "access_logs.s3.enabled", "value": "false"},
                {"key": "idle_timeout.timeout_seconds", "value": "60"},
                {"key": "deletion_protection.enabled", "value": "false"},
                {"key": "routing.http2.enabled", "value": "true"},
                {
                    "key": "routing.http.drop_invalid_header_fields.enabled",
                    "value": "false",
                },
                {"key": "routing.http.xff_client_port.enabled", "value": "false"},
                {"key": "routing.http.preserve_host_header.enabled", "value": "false"},
                {"key": "routing.http.xff_header_processing.mode", "value": "append"},
                {"key": "load_balancing.cross_zone.enabled", "value": "true"},
                {"key": "routing.http.desync_mitigation_mode", "value": "defensive"},
                {"key": "client_keep_alive.seconds", "value": "3600"},
                {"key": "waf.fail_open.enabled", "value": "false"},
                {
                    "key": "routing.http.x_amzn_tls_version_and_cipher_suite.enabled",
                    "value": "false",
                },
                {"key": "zonal_shift.config.enabled", "value": "false"},
                {"key": "connection_logs.s3.enabled", "value": "false"},
            ],
        )

        elasticloadbalancingv2listener = elasticloadbalancingv2.CfnListener(
            self,
            "ElasticLoadBalancingV2Listener",
            load_balancer_arn=elasticloadbalancingv2loadbalancer.ref,
            port=443,
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS13-1-2-2021-06",
            certificates=[
                {
                    "certificate_arn": "arn:aws:acm:ap-northeast-1:584575096038:certificate/4a56954b-be8e-411f-b37a-5123f153b8da"
                }
            ],
            default_actions=[
                {
                    "order": 1,
                    "target_group_arn": "arn:aws:elasticloadbalancing:ap-northeast-1:584575096038:targetgroup/RssFeeEcsFrontend002/7839ef92fce76cd1",
                    "type": "forward",
                }
            ],
        )

        elasticloadbalancingv2listener2 = elasticloadbalancingv2.CfnListener(
            self,
            "ElasticLoadBalancingV2Listener2",
            load_balancer_arn=elasticloadbalancingv2loadbalancer.ref,
            port=80,
            protocol="HTTP",
            default_actions=[
                {
                    "order": 1,
                    "redirect_config": {
                        "protocol": "HTTPS",
                        "port": "443",
                        "host": "#{host}",
                        "path": "/#{path}",
                        "query": "#{query}",
                        "status_code": "HTTP_301",
                    },
                    "type": "redirect",
                }
            ],
        )

        elasticloadbalancingv2listenerrule = elasticloadbalancingv2.CfnListenerRule(
            self,
            "ElasticLoadBalancingV2ListenerRule",
            priority="1",
            listener_arn=elasticloadbalancingv2listener.ref,
            conditions=[
                {"field": "path-pattern", "path_pattern_config": {"values": ["/api/*"]}}
            ],
            actions=[
                {
                    "type": "forward",
                    "target_group_arn": "arn:aws:elasticloadbalancing:ap-northeast-1:584575096038:targetgroup/RssFeeEcsBackend002/9178a17a7bc5ee4a",
                    "order": 1,
                    "forward_config": {
                        "target_groups": [
                            {
                                "target_group_arn": "arn:aws:elasticloadbalancing:ap-northeast-1:584575096038:targetgroup/RssFeeEcsBackend002/9178a17a7bc5ee4a",
                                "weight": 1,
                            }
                        ],
                        "target_group_stickiness_config": {
                            "enabled": False,
                            "duration_seconds": 3600,
                        },
                    },
                }
            ],
            tags=[{"key": "Name", "value": "rule-backend"}],
        )


app = cdk.App()
NkLoadBalancerStack(app, "nk-load-balancer", env={"region": "ap-northeast-1"})
app.synth()
