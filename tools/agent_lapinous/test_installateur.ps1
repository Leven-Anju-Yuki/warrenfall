# Toutes les commandes Windows sont remplacees ; aucun service reel.
$ErrorActionPreference='Stop'
$global:writes=[Collections.Generic.List[object]]::new()
$settings=[pscustomobject]@{Enabled=$true;StartWhenAvailable=$false;WakeToRun=$false;MultipleInstances='IgnoreNew'}
$global:fixtures=@(
 [pscustomobject]@{TaskName='Lapinous - Images Cloudinary 20h';TaskPath='\';State='Ready';Actions='run-image-schedule.ps1';Settings=$settings},
 [pscustomobject]@{TaskName='Lapinous - Bilan quotidien 21h';TaskPath='\';State='Disabled';Actions='agent.py bilan';Settings=[pscustomobject]@{Enabled=$false}}
)
function Get-TimeZone {[pscustomobject]@{Id='Romance Standard Time'}}
function Get-ScheduledTask {$global:fixtures}
function New-ScheduledTaskAction {param($Execute,$Argument,$WorkingDirectory) [pscustomobject]@{Arguments=$Argument}}
function New-ScheduledTaskTrigger {param([switch]$Daily,$At) [pscustomobject]@{At=$At}}
function Set-ScheduledTask {param($TaskName,$TaskPath,$Action,$Trigger,$Settings) $global:writes.Add([pscustomobject]@{Type='Set';Name=$TaskName;Args=$Action.Arguments;Hour=$Trigger.At;Enabled=$Settings.Enabled;Catchup=$Settings.StartWhenAvailable})}
function Disable-ScheduledTask {param($TaskName,$TaskPath) $global:writes.Add([pscustomobject]@{Type='Disable';Name=$TaskName})}
function Export-ScheduledTask {param($TaskName,$TaskPath) '<Task>TEST ISOLATED</Task>'}
function Register-ScheduledTask {throw 'Creation de tache interdite'}
function Start-ScheduledTask {throw 'Execution reelle interdite'}
function Enable-ScheduledTask {throw 'Reactivation interdite'}
$installer=Join-Path $PSScriptRoot 'installer_taches.ps1'
& $installer
if ($global:writes.Count) {throw 'Simulation avec effets secondaires'}
& $installer -Appliquer
if ($global:writes.Count -ne 2) {throw 'Nombre de modifications incorrect'}
$change=$global:writes[0]
if ($change.Type -ne 'Set' -or $change.Name -ne $fixtures[0].TaskName -or $change.Hour -ne '20:00' -or $change.Args -notmatch '-AppliquerChaine' -or $change.Catchup) {throw 'Action ou horaire incorrect'}
if ($global:writes[1].Type -ne 'Disable') {throw 'Ancien bilan non desactive'}
$global:writes.Clear()
$fixtures[0].Settings.Enabled=$false
& $installer -Appliquer
if ($global:writes[0].Enabled) {throw 'Tache desactivee reactivee'}
$global:writes.Clear()
$global:fixtures+= $fixtures[0]
$rejected=$false
try {& $installer -Appliquer} catch {$rejected=$true}
if (-not $rejected -or $global:writes.Count) {throw 'Doublons non refuses'}
$global:fixtures=@()
$rejected=$false
try {& $installer -Appliquer} catch {$rejected=$true}
if (-not $rejected -or $global:writes.Count) {throw 'Creation sans tache existante'}
Write-Host '5 scenarios installateur OK : simulation, reutilisation, etat preserve, doublons et absence refuses.'
