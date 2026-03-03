# PowerShell script to start the frontend server
Set-Location -Path (Join-Path $PSScriptRoot ".." "frontend")
npm run dev 