param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [string]$ComposeFile = "compose.yml",
  [string]$DatabaseUser = "postgres"
)

$ErrorActionPreference = "Stop"
$resolved = (Resolve-Path -LiteralPath $BackupPath).Path
if (-not $resolved.EndsWith(".dump", [StringComparison]::OrdinalIgnoreCase)) { throw "Informe um arquivo .dump." }
$checksumPath = "$resolved.sha256"
if (Test-Path -LiteralPath $checksumPath) {
  $expected = ((Get-Content -LiteralPath $checksumPath -Raw).Trim() -split "\s+")[0].ToUpperInvariant()
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolved).Hash.ToUpperInvariant()
  if ($actual -ne $expected) { throw "O checksum SHA256 do backup não confere." }
}
$database = "autcompany_restore_" + (Get-Date -Format "yyyyMMddHHmmss")
if (-not $database.StartsWith("autcompany_restore_")) { throw "Nome temporário inválido." }
$compose = @("compose", "-f", $ComposeFile)
$container = & docker @compose ps -q db
if (-not $container) { throw "O container PostgreSQL não está ativo." }

docker cp $resolved "${container}:/tmp/autcompany_verify.dump"
& docker @compose exec -T db pg_restore -l /tmp/autcompany_verify.dump | Select-Object -First 12
& docker @compose exec -T db createdb -U $DatabaseUser $database
if ($LASTEXITCODE -ne 0) { throw "Falha ao criar banco temporário." }

try {
  & docker @compose exec -T db pg_restore -U $DatabaseUser -d $database --no-owner --no-privileges /tmp/autcompany_verify.dump
  if ($LASTEXITCODE -ne 0) { throw "Falha ao restaurar o backup." }
  $sql = 'SELECT json_build_object(''Empresa'', (SELECT count(*) FROM "Empresa"), ''Socio'', (SELECT count(*) FROM "Socio"), ''ContatoEmpresa'', (SELECT count(*) FROM "ContatoEmpresa"), ''CertificadoDigital'', (SELECT count(*) FROM "CertificadoDigital"), ''AlteracaoEmpresa'', (SELECT count(*) FROM "AlteracaoEmpresa"), ''DocumentoEmpresa'', (SELECT count(*) FROM "DocumentoEmpresa"));'
  $sql | & docker @compose exec -T db psql -U $DatabaseUser -d $database -At
  if ($LASTEXITCODE -ne 0) { throw "Falha ao consultar o banco restaurado." }
  Write-Output "Restauração validada no banco temporário $database."
}
finally {
  & docker @compose exec -T db dropdb -U $DatabaseUser --if-exists $database
  & docker @compose exec -T db rm -f /tmp/autcompany_verify.dump
}
