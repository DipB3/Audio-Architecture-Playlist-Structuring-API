# AWS account setup and first deployment

The code and CI checks are ready. These account resources must be created by an
AWS account administrator before the first cloud deployment. The GitHub workflow
skips its AWS job until the repository variable `AWS_DEPLOY_ENABLED` is `true`.

1. In AWS region `us-east-1`, create a private S3 bucket for Terraform state.
   Enable versioning, default encryption and block all public access. Keep its
   name for the `TF_STATE_BUCKET` GitHub secret. The state bucket is separate
   from the application buckets that Terraform will create.
2. In AWS IAM, add GitHub's OIDC provider
   `https://token.actions.githubusercontent.com` with audience
   `sts.amazonaws.com`. Create a deployment role with a trust policy limited to
   this repository's `production` environment and the audience above. Check
   [GitHub's OIDC subject format](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
   for this repository: repositories created after 15 July 2026 may use
   immutable owner and repository IDs in `sub`. Do not use a wildcard subject.
3. Grant the role access to the Terraform state bucket and the AWS services in
   `terraform/`: Lambda, API Gateway, DynamoDB, S3, CloudFront, IAM, CloudWatch,
   Budgets and resource tagging. Review the Terraform plan and scope the policy
   to this deployment. The role also needs S3 upload and CloudFront invalidation
   permissions for the frontend publication step.
4. In GitHub, create the `production` environment for the repository. Restrict
   deployment branches to `main` and set required reviewers. Add the role ARN as
   environment secret `AWS_DEPLOY_ROLE_ARN` and the state bucket name as
   environment secret `TF_STATE_BUCKET`. No long-lived AWS keys are needed.
5. Review the budget email recipients and the API throttling limits
   (`api_throttle_rate_limit`, `api_throttle_burst_limit`) in `terraform/variables.tf`. Set the
   repository variable `AWS_DEPLOY_ENABLED` to `true`. On the Actions page, run
   **CI and AWS Deployment - Audio Architecture System** on `main`. After CI
   passes, approve `production` for **Plan AWS Infrastructure**, read the
   Terraform plan in that job's run summary, and approve `production` again for
   **Apply Reviewed Plan** only if the changes are expected. The apply job uses
   the saved plan, so nothing outside the reviewed plan is changed. The plan
   artifact is kept for three days and is visible to anyone who can read the
   repository's Actions runs.
6. Save the Terraform outputs, successful deployed-verification artifact, a
   CloudFront browser screenshot, and evidence of DynamoDB/S3 activity. Check
   AWS Billing for actual charges. Budget notifications are alerts, not a cap.

The deployed API is a shared guest demo. Its `user_id` field does not authenticate
callers or isolate private histories. The custom-track catalog is likewise
shared across visitors. Terraform creates two DynamoDB tables: playlist history
and custom tracks. Add authentication, per-user authorization, restricted CORS
and abuse controls before storing personal or private playlists or song metadata.

References: [AWS guidance for GitHub OIDC roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html),
[AWS guidance for S3 Terraform state](https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/backend.html),
[GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments).
