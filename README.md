# Audio Architecture and Playlist Structuring API

Cloud Computing and DevOps mini project. Team 6, Batch B2, Section B.
Supervisor: Dr. Soumya Nandan Mishra.
Team: Dipankar Banerjee (240905618), Pratham Shah (240905614),
Vaibhav Bhatia (240905504).

The application creates tracklists that follow a requested energy curve while
balancing tempo, musical key, genre affinity and session duration. React,
the Python API, storage adapters and exporters implement the four synopsis modules.

## Features

- Seven energy profiles, including custom control points.
- Duration-aware beam search, cached transitions and sampled energy scoring.
- BPM limits, exclusions, repeat control and adjustable genre variety.
- Planned crossfade overlap included in duration, timeline and export metadata.
- Saved sessions that reload the exact generated tracklist.
- Full target curve visualization, measured metrics and feasibility warnings.
- M3U, JSON and CSV exports, with private S3 download links in cloud mode.
- Synthesized previews and a clearly identified browser fallback.
- Four one-click scenario starters (deep work, movement, evening reset and
  open-format mix), plus an accessible custom-track metadata form and catalog
  exclusions.

The catalog contains 118 deterministic, fictional demonstration metadata records
across seven genres. Custom tracks are stored on local disk in development,
browser storage in offline mode, or a dedicated DynamoDB table on AWS.
The repository does not contain audio recordings. Previews synthesize motifs.
M3U paths require corresponding user-supplied recordings. Crossfade settings plan
overlap; the application does not render an audio mix.

## Local setup

Requires Python 3.11 or later and Node 22.12 or later.

```powershell
npm --prefix frontend ci
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run_local.ps1
```

Open http://localhost:3000. The local runner uses disk storage without AWS
credentials. If the API is unreachable, the browser uses a simpler greedy
optimizer. API validation errors appear to the user without switching modes.

## Verification

```powershell
python -m unittest discover -s backend/tests -v
python scripts/verify_project.py
node scripts/test_frontend_api.mjs
npm --prefix frontend run lint
npm --prefix frontend run build
terraform -chdir=terraform init -backend=false
terraform -chdir=terraform fmt -check
terraform -chdir=terraform validate
```

The integration verifier starts an isolated gateway, checks custom-track
create/list/delete, generation, retrieval, history and all exports, stops the gateway, and writes
docs/TEST_RESULTS.json and docs/TEST_RESULTS.md. It compares the original
committed engine with the improved engine using identical requests.
41 backend tests, frontend service tests, lint/build and HTTP checks passed
locally on 19 October 2026. GitHub CI also passed its backend, frontend and
Terraform validation jobs on commit `1ea734d`. The Terraform CLI is unavailable
on this workstation. See the report for measurements.

## AWS deployment

Terraform defines API Gateway, Lambda, DynamoDB, export S3, private frontend S3,
CloudFront, CloudWatch, IAM and budget notifications. Cloud persistence failures
do not silently use temporary Lambda disk storage.

Create an encrypted, versioned S3 state bucket and a GitHub production
environment. Configure AWS_DEPLOY_ROLE_ARN and TF_STATE_BUCKET secrets.
The IAM deployment role must trust GitHub OIDC for this repository's production
environment and have permission to manage the declared resources and state.
Set the repository variable `AWS_DEPLOY_ENABLED=true` only after the state bucket,
role and secrets exist. Require approval on the production environment before
deployment. Without this variable, pushes run CI and skip the AWS job.

Pushes to main or master test the stack; deployment requires the enable variable.
The workflow can also be started manually after account setup. The pipeline
builds React using the API output, publishes to S3, invalidates CloudFront and
checks the deployed API, connected storage and exports.

Manual deployment:

```powershell
terraform -chdir=terraform init -backend-config="bucket=YOUR_STATE_BUCKET" -backend-config="key=audio-architecture/terraform.tfstate" -backend-config="region=us-east-1" -backend-config="encrypt=true"
terraform -chdir=terraform plan -var-file=terraform.tfvars.example
terraform -chdir=terraform apply -var-file=terraform.tfvars.example
```

Terraform outputs include frontend_url, api_gateway_endpoint,
frontend_bucket_name and frontend_cloudfront_distribution_id.
Review budget addresses before applying. Notifications do not enforce a
spending cap. Actual AWS deployment and costs remain unverified.

## Submission materials

- [Technical design](docs/TECHNICAL_DESIGN_DOCUMENT.md)
- [Mathematical formulation](docs/MATHEMATICAL_FORMULATION.md)
- [API specification](docs/API_SPECIFICATION.md)
- [Measured test results](docs/TEST_RESULTS.md)
- [Updated presentation](deliverables/Audio_Architecture_Presentation_Final.pptx)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [AWS account setup](docs/AWS_SETUP.md)
- [Deployment and deliverables status](DEPLOYMENT.md)
