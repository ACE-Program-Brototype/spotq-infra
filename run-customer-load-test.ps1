# SpotQ Customer Load Runner Shortcut (Run from infra root)
# Usage:
#   .\run-customer-load-test.ps1
#   .\run-customer-load-test.ps1 -Profile load -Type all
#   .\run-customer-load-test.ps1 -Profile smoke -Type journey

param(
    [string]$Profile = "smoke",
    [string]$Type = "all",
    [string]$BaseUrl = "http://host.docker.internal:10000"
)

$targetDir = Join-Path $PSScriptRoot "load_testing\customer"
Push-Location $targetDir
try {
    .\run-k6.ps1 -Profile $Profile -Type $Type -BaseUrl $BaseUrl
} finally {
    Pop-Location
}
