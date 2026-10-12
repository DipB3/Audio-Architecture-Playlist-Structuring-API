# PowerShell script to package AWS Lambda artifact into zip
$outputZip = "terraform/lambda_payload.zip"
$sourceDir = "backend"
$stagingDir = Join-Path ([System.IO.Path]::GetTempPath()) "audio-architecture-lambda-package"

Write-Host "Packaging Lambda function from $sourceDir to $outputZip..." -ForegroundColor Cyan

try {
    if (Test-Path $stagingDir) {
        Remove-Item -LiteralPath $stagingDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $stagingDir | Out-Null
    $stagedApp = Join-Path $stagingDir "app"
    New-Item -ItemType Directory -Path $stagedApp | Out-Null
    Copy-Item -Path "$sourceDir/app/*" -Destination $stagedApp -Recurse -Force

    Get-ChildItem -LiteralPath $stagingDir -Directory -Recurse -Filter "__pycache__" |
        Remove-Item -Recurse -Force
    Get-ChildItem -LiteralPath $stagingDir -File -Recurse |
        Where-Object { $_.Extension -eq ".pyc" } |
        Remove-Item -Force

    foreach ($runtimeDirectory in @("app/data/saved_playlists", "app/data/s3_local_exports")) {
        $target = Join-Path $stagingDir $runtimeDirectory
        if (Test-Path -LiteralPath $target) {
            Remove-Item -LiteralPath $target -Recurse -Force
        }
    }

    if (Test-Path $outputZip) {
        Remove-Item -LiteralPath $outputZip -Force
    }
    Compress-Archive -Path "$stagingDir/*" -DestinationPath $outputZip -Force
    Write-Host "Successfully generated Lambda zip archive at $outputZip" -ForegroundColor Green
} finally {
    if (Test-Path -LiteralPath $stagingDir) {
        Remove-Item -LiteralPath $stagingDir -Recurse -Force
    }
}
