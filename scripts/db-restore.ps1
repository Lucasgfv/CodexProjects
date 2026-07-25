[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$BackupFile,

  [switch]$Confirm
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $projectRoot "compose.yaml"
$backupDirectory = Join-Path $projectRoot "backups"
$resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path

if ([System.IO.Path]::GetExtension($resolvedBackup) -ne ".dump") {
  throw "Use um arquivo de backup com extensão .dump."
}

New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
$backupRoot = [System.IO.Path]::GetFullPath($backupDirectory)
$sourceRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $resolvedBackup))

if ($sourceRoot -ne $backupRoot) {
  $importName = "import-$((Get-Date).ToString('yyyyMMdd-HHmmss'))-$([System.IO.Path]::GetFileName($resolvedBackup))"
  $stagedBackup = Join-Path $backupDirectory $importName
  Copy-Item -LiteralPath $resolvedBackup -Destination $stagedBackup
} else {
  $stagedBackup = $resolvedBackup
}

$containerFile = "/backups/$([System.IO.Path]::GetFileName($stagedBackup))"

& docker compose -f $composeFile exec -T postgres pg_isready --quiet
if ($LASTEXITCODE -ne 0) {
  throw "O PostgreSQL não está pronto. Execute 'pnpm db:up' e tente novamente."
}

& docker compose -f $composeFile exec -T postgres pg_restore --list $containerFile | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "O arquivo não é um backup PostgreSQL válido no formato custom."
}

if (-not $Confirm) {
  $answer = Read-Host "A restauração substituirá os dados atuais. Digite RESTAURAR para continuar"
  if ($answer -cne "RESTAURAR") {
    Write-Host "Restauração cancelada."
    exit 0
  }
}

Write-Host "Criando backup preventivo do banco atual..."
& (Join-Path $PSScriptRoot "db-backup.ps1")
if ($LASTEXITCODE -ne 0) {
  throw "Não foi possível criar o backup preventivo. A restauração foi cancelada."
}

$restoreCommand = 'pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" "{0}"' -f $containerFile
& docker compose -f $composeFile exec -T postgres sh -c $restoreCommand
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao restaurar o backup. O backup preventivo permanece na pasta backups."
}

Push-Location $projectRoot
try {
  & pnpm db:migrate:deploy
  if ($LASTEXITCODE -ne 0) {
    throw "Os dados foram restaurados, mas as migrations pendentes falharam."
  }
} finally {
  Pop-Location
}

Write-Host "Banco restaurado com sucesso a partir de $resolvedBackup"
