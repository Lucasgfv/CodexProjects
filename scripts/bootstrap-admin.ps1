param(
  [Parameter(Mandatory = $true)]
  [string]$Email,
  [string]$Name = "Administrador",
  [string]$ComposeFile = "compose.yml"
)

$ErrorActionPreference = "Stop"
$securePassword = Read-Host "Senha temporária forte" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
  $env:AUTCOMPANY_BOOTSTRAP_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  docker compose -f $ComposeFile exec -T -e AUTCOMPANY_BOOTSTRAP_PASSWORD app pnpm user:bootstrap $Email $Name
  if ($LASTEXITCODE -ne 0) { throw "Falha ao criar o primeiro administrador." }
}
finally {
  Remove-Item Env:AUTCOMPANY_BOOTSTRAP_PASSWORD -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
