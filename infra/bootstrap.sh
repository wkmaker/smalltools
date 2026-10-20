#!/usr/bin/env bash
# 一次性前置：在本機以 AWS 管理員身分部署 infra/bootstrap.yml，並把角色 ARN 寫入 GitHub 儲存庫變數。
# 需求：已安裝 AWS CLI v2 並登入（aws sts get-caller-identity 可用）、已安裝 gh 並登入。
# 可重複執行；範本沒有變更時不會改動任何資源。
set -euo pipefail

# Windows 版 AWS CLI 預設以系統字碼頁（繁中為 cp950）讀檔，範本含中文會解碼失敗
export AWS_CLI_FILE_ENCODING=UTF-8

REGION="us-east-1" # CloudFront 使用的 ACM 憑證只能建在 us-east-1，整組資源統一放這裡
STACK_NAME="smalltools-bootstrap"
REPO="wkmaker/smalltools"
SITE_STACK="smalltools-site"       # 須與 bootstrap.yml 的 SiteStackName 預設值一致
STAGING_STACK="smalltools-staging" # 須與 bootstrap.yml 的 StagingStackName 預設值一致
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 儲存庫可能啟用不可變主體（sub 帶擁有者與儲存庫的數字 ID），以 GitHub 實際發出的前綴為準
subject_prefix="$(gh api "repos/${REPO}/actions/oidc/customization/sub" --jq '.sub_claim_prefix // empty' 2>/dev/null || true)"
subject_prefix="${subject_prefix:-repo:${REPO}}"
echo "GitHub OIDC 主體前綴：${subject_prefix}"

account_id="$(aws sts get-caller-identity --query Account --output text)"
echo "AWS 帳號：${account_id}，區域：${REGION}"

# 帳號內若已有 GitHub OIDC 身分提供者就沿用，避免重複建立失敗
oidc_arn="arn:aws:iam::${account_id}:oidc-provider/token.actions.githubusercontent.com"
existing_oidc=""
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${oidc_arn}" >/dev/null 2>&1; then
  owner="$(aws cloudformation describe-stack-resource --region "${REGION}" --stack-name "${STACK_NAME}" \
    --logical-resource-id GitHubOidcProvider --query StackResourceDetail.PhysicalResourceId --output text 2>/dev/null || true)"
  if [ "${owner}" != "${oidc_arn}" ]; then
    echo "沿用既有的 GitHub OIDC 身分提供者"
    existing_oidc="${oidc_arn}"
  fi
fi

aws cloudformation deploy \
  --region "${REGION}" \
  --stack-name "${STACK_NAME}" \
  --template-file "${SCRIPT_DIR}/bootstrap.yml" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides "GitHubSubjectPrefix=${subject_prefix}" "ExistingOidcProviderArn=${existing_oidc}" \
  --no-fail-on-empty-changeset

# 執行角色只能管理帶 site-stack 標籤的發佈與憑證；標籤規則上線前建立的資源沒有標籤，以管理員身分補上（已有則覆寫為同值）
tag_site_resources() {
  local stack="$1"
  if ! aws cloudformation describe-stacks --region "${REGION}" --stack-name "${stack}" >/dev/null 2>&1; then
    echo "堆疊 ${stack} 尚未建立，略過補標籤"
    return
  fi
  local resource_type physical_id
  while read -r resource_type physical_id; do
    case "${resource_type}" in
      AWS::CloudFront::Distribution)
        aws cloudfront tag-resource \
          --resource "arn:aws:cloudfront::${account_id}:distribution/${physical_id}" \
          --tags "Items=[{Key=site-stack,Value=${stack}}]"
        echo "已標記發佈 ${physical_id} → ${stack}"
        ;;
      AWS::CertificateManager::Certificate)
        aws acm add-tags-to-certificate --region "${REGION}" \
          --certificate-arn "${physical_id}" \
          --tags "Key=site-stack,Value=${stack}"
        echo "已標記憑證 ${physical_id} → ${stack}"
        ;;
    esac
  done < <(aws cloudformation describe-stack-resources --region "${REGION}" --stack-name "${stack}" \
    --query "StackResources[?ResourceType=='AWS::CloudFront::Distribution' || ResourceType=='AWS::CertificateManager::Certificate'].[ResourceType,PhysicalResourceId]" \
    --output text | tr -d '\r')
}

tag_site_resources "${SITE_STACK}"
tag_site_resources "${STAGING_STACK}"

output() {
  aws cloudformation describe-stacks --region "${REGION}" --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

deploy_role_arn="$(output GitHubDeployRoleArn)"
exec_role_arn="$(output CfnExecutionRoleArn)"
staging_deploy_role_arn="$(output GitHubStagingDeployRoleArn)"
staging_exec_role_arn="$(output StagingCfnExecutionRoleArn)"

gh variable set AWS_DEPLOY_ROLE_ARN --repo "${REPO}" --body "${deploy_role_arn}"
gh variable set AWS_CFN_EXEC_ROLE_ARN --repo "${REPO}" --body "${exec_role_arn}"
gh variable set AWS_STAGING_DEPLOY_ROLE_ARN --repo "${REPO}" --body "${staging_deploy_role_arn}"
gh variable set AWS_STAGING_CFN_EXEC_ROLE_ARN --repo "${REPO}" --body "${staging_exec_role_arn}"

echo "完成。GitHub 儲存庫變數已設定："
echo "  AWS_DEPLOY_ROLE_ARN=${deploy_role_arn}"
echo "  AWS_CFN_EXEC_ROLE_ARN=${exec_role_arn}"
echo "  AWS_STAGING_DEPLOY_ROLE_ARN=${staging_deploy_role_arn}"
echo "  AWS_STAGING_CFN_EXEC_ROLE_ARN=${staging_exec_role_arn}"
echo "推送到 main 或在 Actions 頁手動執行「部署 smalltools」即會自動建立網站資源。"
