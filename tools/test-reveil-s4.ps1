param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
# Test local uniquement. Aucun module du projet ni service distant.
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$record = [ordered]@{ timestamp=(Get-Date).ToString('o'); phase='task-start'; battery=$null }
try {
    $b = Get-CimInstance Win32_Battery
    $record.battery = @($b | Select-Object EstimatedChargeRemaining,BatteryStatus)
} catch { $record.batteryError = $_.Exception.Message }
$record | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'execution.json') -Encoding UTF8
# Laisser le temps de vider le journal avant le retour S4.
Start-Sleep -Seconds 20
[ordered]@{timestamp=(Get-Date).ToString('o');phase='hibernate-request'} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $OutputDirectory 'retour-s4.json') -Encoding UTF8
& "$env:SystemRoot\System32\shutdown.exe" /h
if ($LASTEXITCODE -ne 0) { throw "Retour S4 refuse : code $LASTEXITCODE" }
