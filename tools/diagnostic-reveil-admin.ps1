# Lecture seule : ne change ni alimentation, ni taches, ni journalisation Windows.
$ErrorActionPreference='Stop'
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
$principal=[Security.Principal.WindowsPrincipal]::new($identity)
if(-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){
 throw 'Ouvrir PowerShell en tant qu administrateur pour ce diagnostic en lecture seule.'
}
$root=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $root ('.cloudinary-local\wake-test\diagnostic-admin_'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $folder -Force | Out-Null
foreach($command in @('a','waketimers','lastwake')){
 & powercfg ('/'+$command) 2>&1 | Out-File -LiteralPath (Join-Path $folder ($command+'.txt')) -Encoding UTF8
}
& powercfg /sleepstudy /output (Join-Path $folder 'sleepstudy.html') /duration 3
& powercfg /systemsleepdiagnostics /output (Join-Path $folder 'systemsleepdiagnostics.html') /duration 3
Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Kernel-Power';Id=42,107,506,507;StartTime=(Get-Date).AddDays(-3)} -ErrorAction SilentlyContinue | Select-Object TimeCreated,Id,Message | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $folder 'kernel-power.json') -Encoding UTF8
Write-Host ('Rapports crees dans '+$folder+' ; aucun parametre Windows modifie.')
