# PowerShell script to start the backend server
Set-Location -Path (Join-Path $PSScriptRoot ".." "backend")
npm run dev 