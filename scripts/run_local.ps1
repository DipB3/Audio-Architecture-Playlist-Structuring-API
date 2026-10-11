# PowerShell script to run the local demo environment for Lab 12 Live Presentation
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " AUDIO ARCHITECTURE & PLAYLIST STRUCTURING API - LOCAL RUNNER" -ForegroundColor Cyan
Write-Host " Team 6 | 5th Semester | Batch B2 | Academic Year 2026-27" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Start Python Local API Gateway / Lambda Server in background
Write-Host "[1/2] Starting local Python API Gateway server on http://localhost:8000..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location -Path $using:PWD
    python backend/app/local_server.py 8000
}

Start-Sleep -Seconds 2

# 2. Start Vite React Frontend
Write-Host "[2/2] Launching Vite React Dashboard on http://localhost:3000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate both servers when finished." -ForegroundColor Gray

try {
    Set-Location -Path "frontend"
    npm run dev
} finally {
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "`nAll servers stopped cleanly." -ForegroundColor Yellow
}
