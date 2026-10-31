# Service interactif facultatif ; aucune tâche Windows créée.
param([switch]$Verifier)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$botDependencies=Join-Path $projectRoot '.cloudinary-local\discord-bot-deps'
$previousPythonPath=$env:PYTHONPATH
$env:PYTHONIOENCODING='utf-8'
try {
    if(Test-Path -LiteralPath $botDependencies){$env:PYTHONPATH=$botDependencies+[IO.Path]::PathSeparator+$previousPythonPath}
    $botArguments=@('-B',(Join-Path $projectRoot 'tools\agent_lapinous\bot_discord.py'))
    if($Verifier){$botArguments+='--check'}
    & python @botArguments
    $botExit=$LASTEXITCODE
} finally {$env:PYTHONPATH=$previousPythonPath}
exit $botExit
