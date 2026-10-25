# Corrige uniquement l'heure de la tâche existante, sans réinstallation.
param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$taskName = 'Lapinous - Images Cloudinary 20h'
$task = Get-ScheduledTask -TaskName $taskName
if ((Get-TimeZone).Id -ne 'Romance Standard Time') {
    throw 'Le fuseau Windows doit être celui de Paris ; aucun changement effectué.'
}
if (@($task.Triggers).Count -ne 1 -or $task.Triggers[0].CimClass.CimClassName -ne 'MSFT_TaskDailyTrigger') {
    throw 'Déclencheur inattendu : contrôle humain requis, aucune modification.'
}
if ($task.Actions.Arguments -notlike '*run-image-schedule.ps1*') {
    throw 'Action inattendue : aucune modification.'
}
$info = Get-ScheduledTaskInfo -TaskName $taskName
Write-Output ('Avant : ' + $info.NextRunTime + ' ; déclencheur : ' + $task.Triggers[0].StartBoundary)
if (-not $Apply) {
    Write-Output 'Simulation : seul StartBoundary sera remplacé par 20:00, sans décalage UTC fixe.'
    return
}
$folder = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) '.cloudinary-local'
$snapshot = Join-Path $folder ('task-images-before-local-time-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.xml')
Export-ScheduledTask -TaskName $taskName | Set-Content -LiteralPath $snapshot -Encoding UTF8
$task.Triggers[0].StartBoundary = (Get-Date).Date.AddHours(20).ToString("yyyy-MM-dd'T'HH:mm:ss")
Set-ScheduledTask -TaskName $taskName -TaskPath $task.TaskPath -Trigger $task.Triggers | Out-Null
$after = Get-ScheduledTask -TaskName $taskName
$next = (Get-ScheduledTaskInfo -TaskName $taskName).NextRunTime
if ($next.Hour -ne 20 -or $next.Minute -ne 0) {
    throw 'La prochaine exécution calculée ne correspond pas à 20 h : vérifier la tâche.'
}
Write-Output ('Après : ' + $next + ' ; déclencheur : ' + $after.Triggers[0].StartBoundary)
Write-Output ('Action, paramètres, compte et protections conservés. Copie XML privée : ' + $snapshot)
