# Runs the Takeaway worker and restarts it if it stops (for example when the network isn't up yet at login).
# Started at login by the scheduled task that install-autostart.ps1 creates. Output goes to worker.log.
Set-Location -Path (Split-Path -Parent $PSScriptRoot)
$log = Join-Path (Get-Location) "worker.log"

while ($true) {
  # Keep the log small: start a fresh one after 5 MB.
  if ((Test-Path $log) -and (Get-Item $log).Length -gt 5MB) { Move-Item $log "$log.old" -Force }
  Add-Content -Path $log -Encoding utf8 -Value "`r`n=== Starting worker $(Get-Date -Format s) ==="
  cmd.exe /c "npm run worker >> worker.log 2>&1"
  Add-Content -Path $log -Encoding utf8 -Value "=== Worker stopped (exit $LASTEXITCODE); restarting in 30 seconds ==="
  Start-Sleep -Seconds 30
}
