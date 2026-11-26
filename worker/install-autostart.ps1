# Makes the Takeaway worker start automatically, hidden, whenever you log in to Windows. Run once:
#   powershell -ExecutionPolicy Bypass -File worker\install-autostart.ps1
# Start it now without logging out:  Start-ScheduledTask -TaskName "Takeaway worker"
# Stop it:                           Stop-ScheduledTask -TaskName "Takeaway worker"
# Remove it:                         Unregister-ScheduledTask -TaskName "Takeaway worker" -Confirm:$false
$script = Join-Path $PSScriptRoot "start-worker.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$trigger.Delay = "PT30S" # give Wi-Fi a moment to connect
# Every 5 minutes: starts the worker again if it has stopped for any reason (a running one is left alone: IgnoreNew).
$watchdog = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName "Takeaway worker" -Action $action -Trigger $trigger, $watchdog -Settings $settings `
  -Description "Turns links saved to Takeaway into notes. Logs: worker.log in the project folder." -Force | Out-Null
Write-Output "Done: the Takeaway worker will start automatically when you log in, and restart within 5 minutes if it ever stops."
