$ErrorActionPreference = 'Stop'
$env:ELECTRON_RUN_AS_NODE = $null
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe = Join-Path $root 'release\win-unpacked\商业化模块工具箱.exe'
if (-not (Test-Path $exe)) {
  $exe = Get-ChildItem (Join-Path $root 'release\*.exe') -File -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $exe) {
  $dev = Join-Path $root 'node_modules\electron\dist\electron.exe'
  if (Test-Path $dev) {
    & $dev $root --no-sandbox
    exit $LASTEXITCODE
  }
  Write-Host 'Desktop build not found. Run: npm install; npm run desktop:dist'
  Start-Sleep -Seconds 5
  exit 1
}
& $exe --no-sandbox
exit $LASTEXITCODE