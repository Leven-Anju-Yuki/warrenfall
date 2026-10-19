# Test manuel et ponctuel autorise : aucune modification des taches de production.
param([switch]$Armer,[switch]$Verifier,[ValidateRange(3,30)][int]$DansMinutes=8)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $root '.cloudinary-local\wake-test'
$stateFile=Join-Path $folder 'test-courant.json'
$name='Warrenfall - Test temporaire reveil S0'
if($Armer -and $Verifier){throw 'Choisir Armer ou Verifier.'}
if($Armer){
 if(Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue){throw 'Une tache de test existe deja. Verifier son resultat avant tout nouvel essai.'}
 $production=Get-ScheduledTask -TaskName 'Lapinous - Images Cloudinary 20h'
 $time=(Get-Date).AddMinutes($DansMinutes)
 New-Item -ItemType Directory -Path $folder -Force | Out-Null
 $file=Join-Path $folder ((Get-Date -Format 'yyyyMMdd_HHmmss_fff')+'_horodatage.txt')
 $script=Join-Path $PSScriptRoot 'test-reveil-horodatage.ps1'
 $action=New-ScheduledTaskAction -Execute $production.Actions[0].Execute -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -OutputFile "{1}"' -f $script,$file) -WorkingDirectory $root
 $trigger=New-ScheduledTaskTrigger -Once -At $time
 $settings=New-ScheduledTaskSettingsSet -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 1)
 # Aucun rattrapage : une execution apres reouverture ne doit pas simuler un reveil reussi.
 $settings.StartWhenAvailable=$false
 $principal=New-ScheduledTaskPrincipal -UserId $production.Principal.UserId -LogonType Interactive -RunLevel Limited
 Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Test unique : ecrit seulement la date/heure. Aucun Cloudinary, Trello ou Discord.' | Out-Null
 [ordered]@{task=$name;armedAt=(Get-Date).ToString('o');expectedAt=$time.ToString('o');outputFile=$file;status='awaiting_closed_lid_test'} | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
 $task=Get-ScheduledTask -TaskName $name
 $info=$task|Get-ScheduledTaskInfo
 [pscustomobject]@{Task=$name;ScheduledAt=$info.NextRunTime.ToString('o');WakeToRun=$task.Settings.WakeToRun;StartWhenAvailable=$task.Settings.StartWhenAvailable;LogonType=[string]$task.Principal.LogonType;OutputFile=$file;ProductionTasksChanged=$false}|ConvertTo-Json
 return
}
if($Verifier){
 if(-not(Test-Path -LiteralPath $stateFile)){throw 'Aucun test arme.'}
 $state=Get-Content -LiteralPath $stateFile -Raw -Encoding UTF8|ConvertFrom-Json
 $task=Get-ScheduledTask -TaskName $state.task
 $info=$task|Get-ScheduledTaskInfo
 $written=$null
 if(Test-Path -LiteralPath $state.outputFile){$written=(Get-Content -LiteralPath $state.outputFile -Raw).Trim()}
 $expected=[DateTimeOffset]::Parse($state.expectedAt)
 $delay=$null
 if($written){$delay=([DateTimeOffset]::Parse($written)-$expected).TotalSeconds}
 $events=@(Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Kernel-Power';Id=506,507;StartTime=([DateTimeOffset]::Parse($state.armedAt)).LocalDateTime} -MaxEvents 20 -ErrorAction SilentlyContinue|Select-Object @{Name='Time';Expression={$_.TimeCreated.ToString('o')}},Id)
 $result=[ordered]@{ExpectedAt=$state.expectedAt;WrittenAt=$written;DelaySeconds=$delay;LastTaskResult=$info.LastTaskResult;LastRun=$info.LastRunTime.ToString('o');TaskState=[string]$task.State;KernelPowerEvents=$events;ClosedLidConfirmedByUser=$false;Verdict='A confirmer avec la veille reelle et le capot ferme ; un fichier seul ne prouve pas le reveil.'}
 $result|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $folder 'verification.json') -Encoding UTF8
 $result|ConvertTo-Json -Depth 4
 return
}
Write-Host 'Preparation seulement. -Armer programme un unique horodatage dans 8 minutes ; -Verifier lit son resultat. Aucune modification alimentation ou production.'
