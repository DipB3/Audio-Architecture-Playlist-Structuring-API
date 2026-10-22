# Audio Architecture and Playlist Structuring API

Cloud Computing and DevOps mini project. Team 6, Batch B2, Section B.
Supervisor: Dr. Soumya Nandan Mishra.
Team: Dipankar Banerjee (240905618), Pratham Shah (240905614),
Vaibhav Bhatia (240905504).
Repository: https://github.com/VaibhavBhatia-0/Audio-Architecture-Playlist-Structuring-API

The application creates tracklists that follow a requested energy curve while
balancing tempo, musical key, genre affinity and session duration. React,
the Python API, storage adapters and exporters implement the four synopsis modules.

## Features

- Seven energy profiles, including a custom curve with a live shape preview.
- Duration-aware beam search, cached transitions and sampled energy scoring.
- BPM limits, exclusions, repeat control and adjustable genre variety.
- Planned crossfade overlap included in duration, timeline and export metadata.
- Saved sessions that reload the exact generated tracklist.
- Full target curve visualization, measured metrics and feasibility warnings.
- M3U, JSON and CSV exports of stored playlists, with private S3 download links
  in cloud mode. The export endpoint ignores client-supplied playlist bodies, so
  one caller cannot overwrite another playlist's export file.
- Synthesized previews and a clearly identified browser fallback.
- Four one-click scenario starters (deep work, movement, evening reset and
  open-format mix), plus a custom-track metadata form and catalog exclusions.

The catalog contains 118 deterministic, fictional demonstration metadata records
across seven genres. Custom tracks are stored on local disk in development,
browser storage in offline mode, or a dedicated DynamoDB table on AWS.
The repository does not contain audio recordings. Previews synthesize motifs.
M3U paths require corresponding user-supplied recordings. Crossfade settings plan
overlap; the application does not render an audio mix.

## Interface

The React dashboard uses a light "cue sheet" design: warm paper background,
ink text, one vermillion accent, serif headings (Fraunces), Instrument Sans body
text and JetBrains Mono for figures. Sections are separated by ruled lines
rather than cards, and every colour is a solid token defined in
`frontend/src/index.css`. The layout is:

- an introduction with a numbered list of scenario starters;
- a builder with lettered steps (energy shape, genres, length, fine tuning) and
  a sticky summary column that holds the Generate button;
- results directly below the builder: fit metrics, the energy-over-time chart
  and the tracklist with transition details;
- the custom-track form, a short project overview and a team footer.

Keyboard focus is visible throughout, chart points can be focused and played
from the keyboard, dialogs trap focus and close with Escape, and animation
respects reduced-motion settings. At phone width the page does not scroll
sideways; the chart and tracklist scroll within their own areas. Fonts load
from Google Fonts and fall back to system fonts offline.

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
create/list/delete, generation, retrieval, history and all exports, stops the
gateway, and writes docs/TEST_RESULTS.json and docs/TEST_RESULTS.md. It compares
the original committed engine with the improved engine using identical requests.

On 22 October 2026, 43 backend tests, the HTTP verifier, frontend service tests,
lint and the production build passed locally, and the redesigned interface was
checked in a browser at desktop and phone widths. GitHub CI run #7 on commit
`187b784` (export hardening, API throttling, two-stage deployment and the
interface redesign) passed the backend, frontend and Terraform validation jobs;
both AWS jobs were skipped by the deployment gate. The Terraform CLI is
unavailable on this workstation, so Terraform checks rely on CI. See the report
for measurements.

## AWS deployment

Terraform defines API Gateway, Lambda, DynamoDB, export S3, private frontend S3,
CloudFront, CloudWatch, IAM and budget notifications. Cloud persistence failures
do not silently use temporary Lambda disk storage. The API stage is throttled to
5 requests/second with bursts of 10 by default (`api_throttle_rate_limit`,
`api_throttle_burst_limit`); excess requests receive `429`.

Create an encrypted, versioned S3 state bucket and a GitHub production
environment. Configure AWS_DEPLOY_ROLE_ARN and TF_STATE_BUCKET secrets.
The IAM deployment role must trust GitHub OIDC for this repository's production
environment and have permission to manage the declared resources and state.
Set the repository variable `AWS_DEPLOY_ENABLED=true` only after the state bucket,
role and secrets exist. Require approval on the production environment before
deployment. Without this variable, pushes run CI and skip the AWS jobs.

Pushes to main or master test the stack; deployment requires the enable variable.
The workflow can also be started manually after account setup. Deployment needs
two production approvals: the first creates a Terraform plan and shows it in the
run summary; the second applies exactly that saved plan. The pipeline then
builds React using the API output, publishes to S3, invalidates CloudFront and
checks the deployed API, connected storage and exports.

Manual deployment:

```powershell
terraform -chdir=terraform init -backend-config="bucket=YOUR_STATE_BUCKET" -backend-config="key=audio-architecture/terraform.tfstate" -backend-config="region=us-east-1" -backend-config="encrypt=true"
terraform -chdir=terraform plan -var-file=terraform.tfvars.example -out=tfplan
terraform -chdir=terraform apply tfplan
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
- [Frontend notes](frontend/README.md)
