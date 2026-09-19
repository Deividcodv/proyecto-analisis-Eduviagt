<#
.SYNOPSIS
  Script para levantar (o detener) todo el sistema SIGEB localmente.

.DESCRIPTION
  Por defecto levanta:
    1. PostgreSQL (docker compose up -d postgres) y espera a que esté healthy.
    2. Migraciones de Prisma (migrate deploy) y seed (db seed) idempotentes.
    3. La API (NestJS) en http://localhost:3000.
    4. La web (Next.js) en http://localhost:3001.
  Cada servicio se abre en su propia ventana de consola.

  Con -Stop apaga la API y la web (y PostgreSQL salvo -NoDb).

.PARAMETER Stop
  Apaga los servicios en lugar de levantarlos.

.PARAMETER NoDb
  Omite cualquier operación sobre Docker/PostgreSQL (no levanta ni detiene la DB).

.PARAMETER SkipSeed
  Ejecuta las migraciones pero omite el seed.
#>

[CmdletBinding()]
param(
  [switch]$Stop,
  [switch]$NoDb,
  [switch]$SkipSeed
)

# Usamos 'Continue' (por defecto) y validamos explícitamente $LASTEXITCODE.
# Evita que los avisos de docker en stderr disparen NativeCommandError con 'Stop'.
$ErrorActionPreference = 'Continue'

$Root = Split-Path -Parent $PSScriptRoot
$ApiDir = Join-Path $Root 'apps\api'
$StateDir = Join-Path $Root '.sigeb-dev'
$StateFile = Join-Path $StateDir 'pids.json'
$ComposeFile = Join-Path $Root 'docker-compose.yml'

$APIPort = 3000
$WebPort = 3001
$APIUrl = "http://localhost:$APIPort"
$WebUrl = "http://localhost:$WebPort"

function Write-Info($msg) { Write-Host "[SIGEB] $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "[SIGEB] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[SIGEB] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[SIGEB] ERROR: $msg" -ForegroundColor Red }

# ============================================================
# Helpers: procesos por puerto
# ============================================================
function Get-ProcessOnPort([int]$Port) {
  $conn = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  if (-not $conn) { return $null }
  try { return Get-Process -Id ($conn[0].OwningProcess) -ErrorAction Stop } catch { return $null }
}

function Stop-ProcessTree([int]$ProcessId) {
  # Mata el proceso y sus descendientes (watchers de turbo/nest/next)
  try {
    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
      Stop-ProcessTree -ProcessId $child.ProcessId
    }
  } catch { }
  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

function Stop-Port([int]$Port, [string]$Name) {
  $proc = Get-ProcessOnPort -Port $Port
  if ($proc) {
    Stop-ProcessTree -ProcessId $proc.Id
    Write-OK "Detenido $Name en el puerto $Port (PID $($proc.Id))."
  } else {
    Write-Info "$Name ya no está corriendo en el puerto $Port."
  }
}

function Remove-StateFile {
  if (Test-Path $StateFile) { Remove-Item -LiteralPath $StateFile -Force }
}

# ============================================================
# MODO STOP
# ============================================================
if ($Stop) {
  Write-Info "Apagando servicios..."
  Stop-Port -Port $WebPort -Name 'Web (Next.js)'
  Stop-Port -Port $APIPort -Name 'API (NestJS)'
  if (-not $NoDb) {
    Write-Info "Deteniendo PostgreSQL..."
    docker compose -f $ComposeFile stop postgres 2>&1 | Out-Null
    Write-OK "PostgreSQL detenido."
  }
  Remove-StateFile
  Write-OK "Sistema detenido."
  exit 0
}

# ============================================================
# MODO ENCENDIDO
# ============================================================
Write-Info "Levantando SIGEB..."

# --- 1. PostgreSQL ---
if (-not $NoDb) {
  # Verifica que Docker Desktop esté corriendo
  docker info 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Docker Desktop no está corriendo. Inícialo y vuelve a intentar."
    exit 1
  }

  Write-Info "Levantando PostgreSQL..."
  docker compose -f $ComposeFile up -d postgres 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Err "no se pudo levantar PostgreSQL."
    exit 1
  }

  # Espera a que esté healthy (timeout ~90s)
  $deadline = (Get-Date).AddSeconds(90)
  $healthy = $false
  while ((Get-Date) -lt $deadline) {
    $status = (& docker inspect --format '{{.State.Health.Status}}' sigeb-postgres 2>$null) -join ''
    if ($status -eq 'healthy') { $healthy = $true; break }
    Start-Sleep -Seconds 2
  }
  if (-not $healthy) {
    Write-Err "PostgreSQL no alcanzó el estado healthy."
    exit 1
  }
  Write-OK "PostgreSQL listo (healthy)."

  # --- Migraciones ---
  Write-Info "Ejecutando migraciones de Prisma..."
  Push-Location $ApiDir
  try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
      Write-Err "fallaron las migraciones de Prisma."
      exit 1
    }
  } finally { Pop-Location }
  Write-OK "Migraciones aplicadas."

  # --- Seed ---
  if (-not $SkipSeed) {
    Write-Info "Ejecutando seed (idempotente)..."
    Push-Location $ApiDir
    try {
      npx prisma db seed
      if ($LASTEXITCODE -ne 0) {
        Write-Err "falló el seed de Prisma."
        exit 1
      }
    } finally { Pop-Location }
    Write-OK "Seed completado."
  }
}

# --- 2. Arranque limpio: detener procesos previos en los puertos ---
$existing = Get-ProcessOnPort -Port $APIPort
if ($existing) {
  Write-Warn "La API ya está corriendo (PID $($existing.Id)); la reiniciaré."
  Stop-ProcessTree -ProcessId $existing.Id
}
$existingWeb = Get-ProcessOnPort -Port $WebPort
if ($existingWeb) {
  Write-Warn "La web ya está corriendo (PID $($existingWeb.Id)); la reiniciaré."
  Stop-ProcessTree -ProcessId $existingWeb.Id
}
Start-Sleep -Seconds 2

# --- 3. Lanzar API en ventana separada ---
Write-Info "Abriendo API (NestJS) en ventana separada..."
$apiProc = Start-Process -FilePath 'pwsh' `
  -ArgumentList '-NoExit','-NoProfile','-Command',"npm run dev:api --prefix `"$Root`"; Write-Host 'API detenida.'" `
  -WorkingDirectory $Root -PassThru -WindowStyle Normal

# --- 4. Lanzar web en ventana separada ---
Write-Info "Abriendo Web (Next.js) en ventana separada..."
$webProc = Start-Process -FilePath 'pwsh' `
  -ArgumentList '-NoExit','-NoProfile','-Command',"npm run dev:web --prefix `"$Root`"; Write-Host 'Web detenida.'" `
  -WorkingDirectory $Root -PassThru -WindowStyle Normal

# --- 5. Esperar a que los puertos respondan ---
$deadline = (Get-Date).AddSeconds(90)
$raised = $false
while ((Get-Date) -lt $deadline) {
  $apiOk = Get-ProcessOnPort -Port $APIPort
  $webOk = Get-ProcessOnPort -Port $WebPort
  if ($apiOk -and $webOk) { $raised = $true; break }
  if ($apiProc.HasExited -and $webProc.HasExited) { break }
  Start-Sleep -Seconds 2
}

if (-not $raised) {
  $apiOk = Get-ProcessOnPort -Port $APIPort
  $webOk = Get-ProcessOnPort -Port $WebPort
  if (-not $apiOk -or -not $webOk) {
    Write-Err "API y/o web no respondieron en los puertos. Revisa las ventanas abiertas."
  }
}

# --- 6. Guardar estado ---
if (-not (Test-Path $StateDir)) { New-Item -ItemType Directory -Path $StateDir -Force | Out-Null }
@{ apiPort = $APIPort; webPort = $WebPort; apiUrl = $APIUrl; webUrl = $WebUrl } |
  ConvertTo-Json | Set-Content -LiteralPath $StateFile -Encoding UTF8

# --- 7. Resumen ---
Write-OK "SIGEB levantado correctamente."
Write-Host ""
Write-Host "  Web       : $WebUrl" -ForegroundColor Green
Write-Host "  API       : $APIUrl" -ForegroundColor Green
Write-Host "  Swagger   : $APIUrl/api/docs" -ForegroundColor Green
Write-Host ""
Write-Host "  Ventanas: una consola de API y una de web (puedes cerrarlas cuando termines)." -ForegroundColor DarkGray
Write-Host "  Para apagar todo ejecuta:  npm run up:stop" -ForegroundColor Yellow
