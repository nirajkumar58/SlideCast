# PowerShell script to start both servers
# Start the backend server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-File", (Join-Path $PSScriptRoot "start-backend.ps1")

# Start the frontend server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-File", (Join-Path $PSScriptRoot "start-frontend.ps1")

Write-Host "Started both servers in separate windows. Close the windows to stop the servers." 