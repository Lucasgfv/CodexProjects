[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectRoot ".env"

if (Test-Path -LiteralPath $environmentFile) {
  Write-Host "O arquivo .env já existe. Nenhuma alteração foi feita."
  exit 0
}

$randomBytes = New-Object byte[] 24
$random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
  $random.GetBytes($randomBytes)
} finally {
  $random.Dispose()
}
$password = -join ($randomBytes | ForEach-Object { $_.ToString("x2") })

$content = @"
POSTGRES_DB=nexo_contabil
POSTGRES_USER=nexo
POSTGRES_PASSWORD=$password
POSTGRES_PORT=5432

DATABASE_URL="postgresql://nexo:$password@localhost:5432/nexo_contabil?schema=public"
"@

[System.IO.File]::WriteAllText(
  $environmentFile,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Arquivo .env criado com uma senha local aleatória."
