# Réutilise exclusivement la tâche existante ; simulation par défaut.
param([switch]$Appliquer)
$ErrorActionPreference='Stop'
$task=Get-ScheduledTask -TaskName 'Lapinous - Surveillance batterie' -ErrorAction Stop
$interval=@($task.Triggers | Where-Object {$_.Repetition.Interval -eq 'PT15M'})
if($interval.Count -ne 1){throw 'La répétition existante doit être de 15 minutes ; aucun horaire modifié.'}
Write-Host 'Proposition : autoriser démarrage et poursuite sur batterie. Déclencheur 15 minutes conservé.'
if(-not $Appliquer){return}
if($task.State -eq 'Running'){throw 'Contrôle déjà en cours ; attendre sa fin.'}
$backup=Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) '.cloudinary-local\scheduler-backups'
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Export-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath | Set-Content -LiteralPath (Join-Path $backup ((Get-Date -Format 'yyyyMMdd_HHmmss_fff')+'_batterie.xml')) -Encoding Unicode
$settings=$task.Settings
$settings.DisallowStartIfOnBatteries=$false
$settings.StopIfGoingOnBatteries=$false
Set-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -Settings $settings | Out-Null
Write-Host 'Conditions batterie corrigées ; horaires, action et paramètres de réveil inchangés.'
