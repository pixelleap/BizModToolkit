$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host "1/2 拉取远程更新 ..."
git pull --rebase
if ($LASTEXITCODE -ne 0) { throw "git pull 失败" }
Write-Host "2/2 重新构建 ..."
node .\build.mjs .
if ($LASTEXITCODE -ne 0) { throw "构建失败" }
Write-Host "完成。"