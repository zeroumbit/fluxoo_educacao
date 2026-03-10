$ErrorActionPreference = "SilentlyContinue"

Write-Host "Iniciando limpeza do Git Lock..." -ForegroundColor Cyan

# 1. Matar processos Git pendentes
Write-Host "Finalizando processos git.exe..."
taskkill /F /IM git.exe
taskkill /F /IM git-remote-https.exe

# 2. Remover o arquivo lock
$lockPath = Join-Path $PSScriptRoot "../.git/index.lock"
if (Test-Path $lockPath) {
    Write-Host "Removendo arquivo: $lockPath" -ForegroundColor Yellow
    Remove-Item $lockPath -Force
    Write-Host "Lock removido com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Nenhum arquivo de lock encontrado." -ForegroundColor Gray
}

# 3. Verificar status
Write-Host "`nStatus atual do Git:" -ForegroundColor Cyan
git status
