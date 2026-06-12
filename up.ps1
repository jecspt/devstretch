# Build and start DevStretch Plus, then register the portless alias.
# Usage: .\up.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host '▸ Starting portless proxy...' -ForegroundColor Green
portless proxy start 2>$null
# proxy start exits non-zero if already running — that's fine, continue

Write-Host '▸ Building and starting container...' -ForegroundColor Green
docker compose up -d --build

Write-Host '▸ Registering portless alias...' -ForegroundColor Green
portless alias devstrechplus 7300

Write-Host ''
Write-Host '✓ DevStretch Plus is running' -ForegroundColor Green
Write-Host '  https://devstrechplus.localhost' -ForegroundColor Cyan
Write-Host '  http://localhost:7300' -ForegroundColor Cyan
