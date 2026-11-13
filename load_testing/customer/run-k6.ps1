# SpotQ Customer Load Testing Helper Script
# Usage:
#   .\run-k6.ps1
#   .\run-k6.ps1 -Profile load -Type all
#   .\run-k6.ps1 -Profile smoke -Type journey
#   .\run-k6.ps1 -Profile stress -Type queue

param(
    [string]$Profile = "smoke",
    [string]$Type = "all",
    [string]$BaseUrl = "http://host.docker.internal:10000",
    [string]$Email = "customer@spotq.com",
    [string]$Password = "Customer@12345"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SpotQ Customer k6 Load Runner" -ForegroundColor Yellow
Write-Host " Profile:  [$Profile]" -ForegroundColor Green
Write-Host " Suite:    [$Type]" -ForegroundColor Green
Write-Host " Base URL: [$BaseUrl]" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if native k6 CLI is available in PATH
$hasK6 = Get-Command "k6" -ErrorAction SilentlyContinue

if ($hasK6) {
    Write-Host "[Mode] Running via local k6 CLI..." -ForegroundColor Cyan
    $env:BASE_URL = $BaseUrl
    $env:TEST_PROFILE = $Profile
    $env:TEST_TYPE = $Type
    $env:CUSTOMER_EMAIL = $Email
    $env:CUSTOMER_PASSWORD = $Password
    k6 run main.js
} else {
    Write-Host "[Mode] Local k6 not found. Running inside Docker (grafana/k6)..." -ForegroundColor Cyan
    $currentDir = (Get-Location).Path
    
    docker run --rm -i `
        -v "${currentDir}:/scripts" `
        -w /scripts `
        grafana/k6 run `
        -e BASE_URL="$BaseUrl" `
        -e TEST_PROFILE="$Profile" `
        -e TEST_TYPE="$Type" `
        -e CUSTOMER_EMAIL="$Email" `
        -e CUSTOMER_PASSWORD="$Password" `
        main.js
}
