# ECSサービスのネットワーク設定を更新
aws ecs update-service \
  --cluster LifeHubCluster \
  --service nk-lifehub-service \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-031d442c05e47129f],securityGroups=[sg-00c6f726365cf9995],assignPublicIp=ENABLE}"


# ECSサービスのコマンド実行設定を更新
aws ecs update-service \
  --cluster LifeHubCluster \
  --service nk-lifehub-service \
  --enable-execute-command
  
# ECSサービスのコマンド実行設定を確認
aws ecs describe-services --cluster LifeHubCluster --services nk-lifehub-service | jq '.services[].enableExecuteCommand'

# ECSタスクのコンテナにシェルを実行
aws ecs execute-command \
  --cluster LifeHubCluster \
  --task 6d70991b2bb6461397c6874e184e2593 \
  --container nklifehub-backend \
  --interactive \
  --command "/bin/bash"


