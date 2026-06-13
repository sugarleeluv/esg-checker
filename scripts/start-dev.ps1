# Jalankan dari folder proyek: .\scripts\start-dev.ps1
# Memulai database lokal (Prisma Dev) lalu Next.js dev server.

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot\..

Write-Host "=== ESG Checker - Start Dev ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Cek database Prisma Dev..." -ForegroundColor Yellow
$devStatus = npx prisma dev ls 2>&1 | Out-String
if ($devStatus -notmatch "default\s+running") {
    Write-Host "Database belum jalan. Memulai prisma dev..." -ForegroundColor Yellow
    npx prisma dev -d
    Start-Sleep -Seconds 3
} else {
    Write-Host "Database sudah running." -ForegroundColor Green
}

Write-Host "`n[2/3] Tes koneksi database..." -ForegroundColor Yellow
npm run dev:check
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nDatabase gagal. Pastikan DATABASE_URL di .env sesuai output 'npx prisma dev -d'." -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/3] Memulai Next.js di http://127.0.0.1:3000 ..." -ForegroundColor Yellow
Write-Host "Tekan Ctrl+C untuk stop.`n" -ForegroundColor Gray
npm run dev
