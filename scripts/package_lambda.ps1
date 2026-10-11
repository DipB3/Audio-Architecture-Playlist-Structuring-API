# PowerShell script to package AWS Lambda artifact into zip
$outputZip = "terraform/lambda_payload.zip"
$sourceDir = "backend/app"

Write-Host "Packaging Lambda function from $sourceDir to $outputZip..." -ForegroundColor Cyan

if (Test-Path $outputZip) {
    Remove-Item -Force $outputZip
}

Compress-Archive -Path "$sourceDir/*" -DestinationPath $outputZip -Force
Write-Host "Successfully generated Lambda zip archive at $outputZip" -ForegroundColor Green
