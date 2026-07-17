param(
  [string]$LocalRoot = (Join-Path $PSScriptRoot "..\backups"),
  [string]$ExternalRoot = $env:AUTCOMPANY_BACKUP_EXTERNAL,
  [string]$ComposeFile = "compose.yml",
  [string]$DatabaseUser = "postgres",
  [string]$DatabaseName = "autcompany"
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$name = "autcompany_$timestamp.dump"
$daily = Join-Path $LocalRoot "daily"
$weekly = Join-Path $LocalRoot "weekly"
New-Item -ItemType Directory -Force -Path $daily, $weekly | Out-Null

$compose = @("compose", "-f", $ComposeFile)
$container = & docker @compose ps -q db
if (-not $container) { throw "O container PostgreSQL não está ativo." }

& docker @compose exec -T db pg_dump -U $DatabaseUser -d $DatabaseName -Fc -f "/tmp/$name"
if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar o dump PostgreSQL." }

$target = Join-Path $daily $name
docker cp "${container}:/tmp/$name" $target
& docker @compose exec -T db rm -f "/tmp/$name"
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $target)) { throw "Falha ao copiar o dump para o computador." }

$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $target
Set-Content -LiteralPath "$target.sha256" -Value "$($hash.Hash)  $name" -Encoding utf8

if ((Get-Date).DayOfWeek -eq "Sunday") {
  Copy-Item -LiteralPath $target -Destination (Join-Path $weekly $name)
  Copy-Item -LiteralPath "$target.sha256" -Destination (Join-Path $weekly "$name.sha256")
}

Get-ChildItem -LiteralPath $daily -Filter "*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | ForEach-Object {
  Remove-Item -LiteralPath $_.FullName
  Remove-Item -LiteralPath "$($_.FullName).sha256" -ErrorAction SilentlyContinue
}
Get-ChildItem -LiteralPath $weekly -Filter "*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 12 | ForEach-Object {
  Remove-Item -LiteralPath $_.FullName
  Remove-Item -LiteralPath "$($_.FullName).sha256" -ErrorAction SilentlyContinue
}

if (-not $ExternalRoot) {
  throw "Backup local criado e verificado, mas AUTCOMPANY_BACKUP_EXTERNAL não está configurado. Arquivo: $target"
}
if (-not (Test-Path -LiteralPath $ExternalRoot)) { throw "O destino externo não está disponível: $ExternalRoot" }
$externalDaily = Join-Path $ExternalRoot "daily"
$externalWeekly = Join-Path $ExternalRoot "weekly"
New-Item -ItemType Directory -Force -Path $externalDaily, $externalWeekly | Out-Null
Copy-Item -LiteralPath $target, "$target.sha256" -Destination $externalDaily
if ((Get-Date).DayOfWeek -eq "Sunday") {
  Copy-Item -LiteralPath $target, "$target.sha256" -Destination $externalWeekly
}

Get-ChildItem -LiteralPath $externalDaily -Filter "*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | ForEach-Object {
  Remove-Item -LiteralPath $_.FullName
  Remove-Item -LiteralPath "$($_.FullName).sha256" -ErrorAction SilentlyContinue
}
Get-ChildItem -LiteralPath $externalWeekly -Filter "*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 12 | ForEach-Object {
  Remove-Item -LiteralPath $_.FullName
  Remove-Item -LiteralPath "$($_.FullName).sha256" -ErrorAction SilentlyContinue
}

Write-Output "Backup concluído: $target"
Write-Output "SHA256: $($hash.Hash)"
