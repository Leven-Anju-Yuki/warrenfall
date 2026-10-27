$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'chaine_commune.ps1')
$scenarios=@('ok','sync-code','sync-exception','bilan-code','bilan-exception','journal-exception')
foreach ($scenario in $scenarios) {
    $seen=[Collections.Generic.List[string]]::new()
    $execute={param($phase,$context)
        $seen.Add($phase)
        if ($phase -eq 'sync') {
            if ($scenario -eq 'sync-exception') { throw 'Node fictif absent' }
            if ($scenario -eq 'sync-code') { return 7 }
            return 0
        }
        if (-not $context.syncFinishedAt) { throw 'Bilan lance avant fin de sync' }
        if ($scenario -eq 'sync-code' -and $context.syncExit -ne 7) { throw 'Code sync perdu' }
        if ($scenario -eq 'sync-exception' -and -not $context.errors.Count) { throw 'Erreur sync perdue' }
        if ($scenario -eq 'bilan-exception') { throw 'Python fictif absent' }
        if ($scenario -eq 'bilan-code') { return 9 }
        return 0
    }.GetNewClosure()
    $journal={param($line) if ($scenario -eq 'journal-exception') { throw 'Disque fictif indisponible' }}.GetNewClosure()
    $result=Invoke-LapinousSteps -Execute $execute -Journal $journal
    if (($seen -join ',') -ne 'sync,bilan') { throw "Ordre incorrect : $scenario" }
    if ($scenario -eq 'ok' -and ($result.errors.Count -or $result.syncExit -or $result.bilanExit)) { throw 'Faux echec' }
    if ($scenario -ne 'ok' -and -not $result.errors.Count) { throw "Erreur non remontee : $scenario" }
    Write-Host "OK $scenario : sync=$($result.syncExit), bilan=$($result.bilanExit), erreurs=$($result.errors.Count)"
}
Write-Host '6 scenarios de chaine isoles : aucune synchronisation, notification ou commande Trello reelle.'

# Le mode simulation du vrai point d'entrée doit afficher le bilan et conserver son code.
function python {
    if ($args -contains '--appliquer') { throw 'Mode reel interdit' }
    Write-Output 'BILAN FICTIF AFFICHE'
    $global:LASTEXITCODE=7
}
function node { throw 'Aucune synchronisation autorisee' }
$captured=@(Start-LapinousChain -ProjectRoot (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 6>&1)
if (($captured | Out-String) -notmatch 'BILAN FICTIF AFFICHE' -or $captured[-1] -ne 7) { throw 'Sortie ou code de simulation perdu' }
Write-Host '7e scenario OK : simulation native affichee, code conserve et Node interdit.'

# Le nouveau preambule Git doit preceder le relais et ne jamais le bloquer.
$publicationOrder=[Collections.Generic.List[string]]::new()
function python {
    if (($args -join ' ') -match 'nightly_git.py') {
        $publicationOrder.Add('git')
        $global:LASTEXITCODE=3
    } elseif (($args -join ' ') -match 'local_bridge.py') {
        $publicationOrder.Add('cloudinary-et-bilan')
        $global:LASTEXITCODE=0
    } else { throw 'Operation Python inattendue dans le test' }
}
$captured=@(Start-LapinousChain -ProjectRoot (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) -AppliquerChaine 3>&1 6>&1)
if (($publicationOrder -join ',') -ne 'git,cloudinary-et-bilan') { throw 'Publication Git non placee avant Cloudinary ou echec bloquant.' }
Write-Host '8e scenario OK : Git avant le relais ; Cloudinary et bilan tentes meme apres echec Git. Aucun appel reel.'
