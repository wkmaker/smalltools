import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import yaml from 'js-yaml';

/**
 * infra/site.yml 與 infra/bootstrap.yml 的結構契約。CloudFormation 短標記（!Sub、!Ref…）只保留原值供比對。
 * 同帳號放多個網站：部署與執行角色對 CloudFront 發佈、ACM 憑證的寫入權限必須以 site-stack 標籤限制在本站。
 */
const CFN_TAGS = ['Sub', 'Ref', 'GetAtt', 'If', 'Equals', 'Not', 'And', 'Condition', 'Select', 'Split'];
const schema = yaml.DEFAULT_SCHEMA.extend(
  CFN_TAGS.flatMap((name) =>
    ['scalar', 'sequence', 'mapping'].map(
      (kind) => new yaml.Type(`!${name}`, { kind, construct: (value) => ({ [name]: value }) }),
    ),
  ),
);

const load = (file) => yaml.load(fs.readFileSync(new URL(`../../infra/${file}`, import.meta.url), 'utf8'), { schema });
const site = load('site.yml');
const bootstrap = load('bootstrap.yml');
const asArray = (value) => (Array.isArray(value) ? value : [value]);

// ---- site.yml ----

// #77 回歸：正式站曾因 ResponseHeadersPolicyId 落到 AWS::NoValue 而完全沒有安全標頭
test('發佈一律套用本站安全標頭政策，不依環境切換', () => {
  const behavior = site.Resources.Distribution.Properties.DistributionConfig.DefaultCacheBehavior;
  assert.deepEqual(behavior.ResponseHeadersPolicyId, { Ref: 'SecurityHeadersPolicy' });
  const policy = site.Resources.SecurityHeadersPolicy;
  assert.equal(policy.Condition, undefined, '安全標頭政策不可帶 Condition');
  const security = policy.Properties.ResponseHeadersPolicyConfig.SecurityHeadersConfig;
  for (const key of ['StrictTransportSecurity', 'ContentTypeOptions', 'FrameOptions', 'ReferrerPolicy']) {
    assert.ok(security[key], `SecurityHeadersPolicy 缺少 ${key}`);
  }
});

test('測試站加 X-Robots-Tag noindex，正式站不加', () => {
  const custom = site.Resources.SecurityHeadersPolicy.Properties.ResponseHeadersPolicyConfig.CustomHeadersConfig;
  const [condition, staging, production] = custom.If;
  assert.equal(condition, 'IsStaging');
  assert.equal(staging.Items[0].Header, 'X-Robots-Tag');
  assert.match(staging.Items[0].Value, /noindex/);
  assert.deepEqual(production, { Ref: 'AWS::NoValue' });
});

test('憑證只看 DomainName，網域與憑證掛上發佈則另需 AttachDomain', () => {
  assert.equal(site.Resources.Certificate.Condition, 'HasDomain');
  const config = site.Resources.Distribution.Properties.DistributionConfig;
  assert.equal(config.Aliases.If[0], 'UseDomain');
  assert.equal(config.ViewerCertificate.If[0], 'UseDomain');
  assert.deepEqual(site.Conditions.UseDomain.And, [{ Condition: 'HasDomain' }, { Equals: [{ Ref: 'AttachDomain' }, 'true'] }]);
});

test('S3 儲存區不公開，只允許本發佈經 OAC 讀取', () => {
  const block = site.Resources.SiteBucket.Properties.PublicAccessBlockConfiguration;
  for (const key of ['BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets']) {
    assert.equal(block[key], true, `${key} 必須為 true`);
  }
  const allow = site.Resources.SiteBucketPolicy.Properties.PolicyDocument.Statement.find((s) => s.Effect === 'Allow');
  assert.deepEqual(allow.Principal, { Service: 'cloudfront.amazonaws.com' });
  assert.match(allow.Condition.StringEquals['AWS:SourceArn'].Sub, /distribution\/\$\{Distribution\}$/);
});

test('發佈與憑證帶 site-stack=堆疊名稱 標籤', () => {
  for (const logicalId of ['Distribution', 'Certificate']) {
    const tag = (site.Resources[logicalId].Properties.Tags ?? []).find((t) => t.Key === 'site-stack');
    assert.deepEqual(tag?.Value, { Ref: 'AWS::StackName' }, `${logicalId} 缺少 site-stack 標籤`);
  }
});

// ---- bootstrap.yml ----

// 只讀或無法以 IAM 限定資源、已在範本註明為殘餘風險的動作
const UNSCOPED_ALLOWED = new Set([
  'cloudfront:Get*',
  'cloudfront:List*',
  'cloudfront:Describe*',
  'acm:ListCertificates',
  'acm:RequestCertificate',
  'acm:DescribeCertificate',
  'acm:GetCertificate',
  'acm:ListTagsForCertificate',
  'cloudfront:CreateFunction',
  'cloudfront:CreateOriginAccessControl',
  'cloudfront:UpdateOriginAccessControl',
  'cloudfront:DeleteOriginAccessControl',
  'cloudfront:CreateResponseHeadersPolicy',
  'cloudfront:UpdateResponseHeadersPolicy',
  'cloudfront:DeleteResponseHeadersPolicy',
  'cloudformation:ValidateTemplate',
]);

const ROLES = [
  ['CfnExecutionRole', 'SiteStackName'],
  ['GitHubDeployRole', 'SiteStackName'],
  ['StagingCfnExecutionRole', 'StagingStackName'],
  ['GitHubStagingDeployRole', 'StagingStackName'],
];

function roleStatements(logicalId) {
  const role = bootstrap.Resources[logicalId];
  assert.ok(role, `bootstrap.yml 找不到 ${logicalId}`);
  return role.Properties.Policies.flatMap((policy) => policy.PolicyDocument.Statement);
}

const stackParamOf = (statement) =>
  (statement.Condition?.StringEquals?.['aws:ResourceTag/site-stack'] ?? statement.Condition?.StringEquals?.['aws:RequestTag/site-stack'])?.Ref;

for (const [logicalId, stackParam] of ROLES) {
  const statements = roleStatements(logicalId).filter((s) => s.Effect === 'Allow');

  test(`${logicalId}：沒有 cloudfront:* 或 acm:* 萬用權限`, () => {
    const actions = statements.flatMap((s) => asArray(s.Action));
    assert.ok(!actions.includes('cloudfront:*'));
    assert.ok(!actions.includes('acm:*'));
  });

  test(`${logicalId}：對所有資源放行的寫入動作都要求請求帶本站標籤`, () => {
    for (const statement of statements.filter((s) => s.Resource === '*')) {
      for (const action of asArray(statement.Action)) {
        if (UNSCOPED_ALLOWED.has(action)) continue;
        assert.equal(
          statement.Condition?.StringEquals?.['aws:RequestTag/site-stack']?.Ref,
          stackParam,
          `${action} 對 '*' 放行卻沒有要求 site-stack=${stackParam}`,
        );
      }
    }
  });

  test(`${logicalId}：發佈與憑證的寫入都綁本站 site-stack 標籤`, () => {
    const scoped = statements.filter((s) => asArray(s.Resource).some((r) => /:(distribution|certificate)\/\*$/.test(r?.Sub ?? '')));
    assert.ok(scoped.length > 0, '找不到針對發佈或憑證的權限');
    for (const statement of scoped) {
      assert.equal(stackParamOf(statement), stackParam, `${asArray(statement.Action).join(', ')} 沒有綁 site-stack 標籤`);
      // 允許替無標籤資源上標籤的敘述只能標成本站
      if (statement.Condition?.Null) {
        assert.equal(statement.Condition.Null['aws:ResourceTag/site-stack'], 'true');
        assert.equal(statement.Condition.StringEquals['aws:RequestTag/site-stack'].Ref, stackParam);
        assert.deepEqual(asArray(statement.Action).filter((a) => !/Tag/.test(a)), []);
      }
    }
  });
}

test('執行角色的 CloudFront 函式權限只限本站名稱前綴，且拒絕讀取其他網站函式程式碼', () => {
  for (const [logicalId, stackParam] of [['CfnExecutionRole', 'SiteStackName'], ['StagingCfnExecutionRole', 'StagingStackName']]) {
    const statements = roleStatements(logicalId);
    const fnWrite = statements.find((s) => s.Effect === 'Allow' && asArray(s.Action).includes('cloudfront:UpdateFunction'));
    assert.equal(fnWrite.Resource.Sub, `arn:\${AWS::Partition}:cloudfront::\${AWS::AccountId}:function/\${${stackParam}}-*`);
    const denyCode = statements.find((s) => s.Effect === 'Deny' && s.Action === 'cloudfront:GetFunction');
    assert.equal(denyCode?.NotResource?.Sub, fnWrite.Resource.Sub, `${logicalId} 沒有拒絕讀取其他網站的函式程式碼`);
  }
});

test('正式站部署角色只信任 main 分支', () => {
  const trust = bootstrap.Resources.GitHubDeployRole.Properties.AssumeRolePolicyDocument.Statement[0];
  assert.equal(trust.Condition.StringEquals['token.actions.githubusercontent.com:sub'].Sub, '${GitHubSubjectPrefix}:ref:refs/heads/${GitHubBranch}');
  assert.equal(bootstrap.Parameters.GitHubBranch.Default, 'main');
});

test('堆疊名稱互不為前綴（名稱前綴權限才不會重疊）', () => {
  const siteStack = bootstrap.Parameters.SiteStackName.Default;
  const stagingStack = bootstrap.Parameters.StagingStackName.Default;
  assert.ok(!siteStack.startsWith(stagingStack) && !stagingStack.startsWith(siteStack), `${siteStack} 與 ${stagingStack} 互為前綴`);
});
