# Action du test : uniquement un horodatage local, aucun service distant.
param([Parameter(Mandatory=$true)][string]$OutputFile)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\.cloudinary-local\wake-test'))+[IO.Path]::DirectorySeparatorChar
$target=[IO.Path]::GetFullPath($OutputFile)
if(-not $target.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){throw 'Chemin de test hors du dossier autorise.'}
[IO.File]::WriteAllText($target,(Get-Date).ToString('o'),[Text.UTF8Encoding]::new($false))
