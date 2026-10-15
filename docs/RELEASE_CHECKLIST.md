# Release and Presentation Checklist

The four synopsis modules, presentation and measured test report are included.
Engine constraints, HTTP integration, browser generation/history/export preview,
frontend lint/build and Terraform validation passed.

## Account setup and release evidence

1. Repository source is pushed to `main` at
   `https://github.com/VaibhavBhatia-0/Audio-Architecture-Playlist-Structuring-API`.
2. Create an encrypted, versioned Terraform state bucket.
3. Configure GitHub OIDC, an IAM deployment role and the production environment.
4. Set AWS_DEPLOY_ROLE_ARN and TF_STATE_BUCKET secrets.
5. Review budget email recipients and require production deployment approval.
6. Set repository variable `AWS_DEPLOY_ENABLED=true`, rerun the pipeline, and
   retain successful integration artifacts.
7. Open CloudFront and demonstrate generation, reload and download.
8. Capture API Gateway, Lambda logs, DynamoDB items, S3 exports and budget
   subscription evidence. Record actual cost.

The GitHub remote is connected. AWS account setup is still required; no live
deployment, cost or storage evidence has been verified.

## Demo

Choose a 30-minute session and custom curve. Set genres and BPM bounds.
Exclude a track, generate, inspect fit and transitions, reload the saved session
and export M3U, JSON and CSV. Explain that previews synthesize motifs and M3U
references require supplied recordings.
