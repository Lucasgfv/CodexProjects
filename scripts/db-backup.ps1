[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $projectRoot "compose.yaml"
$backupDirectory = Join-Path $projectRoot "backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$fileName = "nexo-contabil-$timestamp.dump"
$hostFile = Join-Path $backupDirectory $fileName

New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null

& docker compose -f $composeFile exec -T postgres pg_isready --quiet
if ($LASTEXITCODE -ne 0) {
  throw "O PostgreSQL não está pronto. Execute 'pnpm db:up' e tente novamente."
}

$containerCommand = 'pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom --file="/backups/{0}"' -f $fileName
& docker compose -f $composeFile exec -T postgres sh -c $containerCommand
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao gerar o backup do PostgreSQL."
}

if (-not (Test-Path -LiteralPath $hostFile)) {
  throw "O PostgreSQL concluiu o comando, mas o arquivo de backup não foi encontrado."
}

$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $hostFile
Write-Host "Backup criado: $hostFile"
Write-Host "SHA-256: $($hash.Hash)"
