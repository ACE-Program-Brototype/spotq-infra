param (
    [string]$Profile = "min100",
    [string]$Type = "core_funnel",
    [string]$BaseUrl = "http://localhost:10000",
    [string]$Email = "customer@spotq.com",
    [string]$Password = "Customer@12345"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SpotQ Customer k6 Load Runner (PowerShell)" -ForegroundColor Cyan
Write-Host " Profile:  [$Profile]" -ForegroundColor Yellow
Write-Host " Suite:    [$Type]" -ForegroundColor Yellow
Write-Host " Base URL: [$BaseUrl]" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$k6Installed = Get-Command k6 -ErrorAction SilentlyContinue

if ($k6Installed) {
    Write-Host "[Mode] Running via local k6 CLI..." -ForegroundColor Green
    $env:BASE_URL = $BaseUrl
    $env:TEST_PROFILE = $Profile
    $env:TEST_TYPE = $Type
    $env:CUSTOMER_EMAIL = $Email
    $env:CUSTOMER_PASSWORD = $Password
    k6 run main.js
} else {
    Write-Host "[Mode] Local k6 not found. Running inside Docker..." -ForegroundColor Yellow
    $dockerBaseUrl = $BaseUrl.Replace("localhost", "host.docker.internal")
    docker run --rm -i `
        -v "${PWD}:/scripts" `
        -w /scripts `
        grafana/k6 run `
        -e BASE_URL="$dockerBaseUrl" `
        -e TEST_PROFILE="$Profile" `
        -e TEST_TYPE="$Type" `
        -e CUSTOMER_EMAIL="$Email" `
        -e CUSTOMER_PASSWORD="$Password" `
        main.js
}
