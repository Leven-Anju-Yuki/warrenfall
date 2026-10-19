# Simulation par defaut. Ne cree jamais de tache et ne reactive aucun ancien bilan.
param([switch]$Appliquer)
$ErrorActionPreference='Stop'
if ((Get-TimeZone).Id -ne 'Romance Standard Time') { throw 'Fuseau Windows different de Paris : aucune modification.' }
$all=@(Get-ScheduledTask)
$images=@($all | Where-Object {
 $_.TaskName -match '^Lapinous.*(Cloudinary|Images.*20)' -or
 (($_.Actions | Out-String) -match 'run-image-schedule|synchronisation_20h|chaine_20h|update-images\.mjs|Synchroniser les images')
})
if ($images.Count -ne 1) { throw 'Il faut exactement une tache Cloudinary existante. Aucune creation ni suppression.' }
$old=@($all | Where-Object { $_.TaskName -match '^Lapinous.*Bilan' -or (($_.Actions | Out-String) -match 'agent\.py.*bilan') })
$task=$images[0]
Write-Host ('Tache conservee : '+$task.TaskPath+$task.TaskName+' ; 20:00 Europe/Paris ; synchronisation puis bilan immediat.')
Write-Host 'Aucun rattrapage des executions manquees ; anciennes taches de bilan uniquement desactivees.'
if (-not $Appliquer) { Write-Host 'Simulation : aucune modification du Planificateur.'; return }
if (@($all | Where-Object { $_.State -eq 'Running' -and ($_.TaskName -eq $task.TaskName -or $_ -in $old) }).Count) { throw 'Une execution est en cours : attendre sa fin avant reconfiguration.' }
$root=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script=Join-Path $root 'tools\run-image-schedule.ps1'
$backup=Join-Path $root '.cloudinary-local\scheduler-backups'
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Export-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath | Set-Content -LiteralPath (Join-Path $backup ((Get-Date -Format 'yyyyMMdd_HHmmss_fff')+'_20h.xml')) -Encoding Unicode
$exe=(Get-Command powershell.exe -ErrorAction Stop).Source
$action=New-ScheduledTaskAction -Execute $exe -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -AppliquerChaine' -f $script) -WorkingDirectory $root
$trigger=New-ScheduledTaskTrigger -Daily -At '20:00'
$settings=$task.Settings
$settings.StartWhenAvailable=$false
$settings.WakeToRun=$true
$settings.MultipleInstances='IgnoreNew'
# L etat active/desactive existant est preserve ; aucun lancement immediat.
Set-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -Action $action -Trigger $trigger -Settings $settings | Out-Null
foreach ($previous in $old) {
 if ($previous.TaskName -ne $task.TaskName -or $previous.TaskPath -ne $task.TaskPath) {
  Disable-ScheduledTask -TaskName $previous.TaskName -TaskPath $previous.TaskPath | Out-Null
 }
}
Write-Host 'Action de la seule tache Cloudinary mise a jour ; aucune tache lancee, creee ou supprimee.'
