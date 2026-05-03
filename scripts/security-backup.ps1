param(
  [string]$OutputDir = "C:\tmp\fluxoo-security-backups"
)

if (-not $env:SUPABASE_DB_URL) {
  Write-Error "SUPABASE_DB_URL is not defined. Set it only in your shell/CI secret store, never in the repository."
  exit 1
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Error "pg_dump was not found in PATH."
  exit 1
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$backupPath = Join-Path $OutputDir "backup-pre-security-v5-$timestamp.sql"

pg_dump $env:SUPABASE_DB_URL --file $backupPath
if ($LASTEXITCODE -ne 0) {
  Write-Error "pg_dump failed."
  exit $LASTEXITCODE
}

Write-Output "Backup created: $backupPath"
