param([string]$Message = "")
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not $Message) { $Message = "更新模块数据 " + (Get-Date -Format "yyyy-MM-dd HH:mm") }

Write-Host "1/3 构建 HTML ..."
node .\build.mjs .
if ($LASTEXITCODE -ne 0) { throw "构建失败，未提交" }

Write-Host "2/3 提交数据与构建产物 ..."
git add data thumbs dist
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "没有需要提交的改动。"
  Write-Host ""
  Write-Host "注意：在网页里换缩略图/改文字，不会自动进 Git。"
  Write-Host "如果刚在网页里改过："
  Write-Host "  1. 网页右上角「分享 -> 数据与身份 -> 导出 JSON」"
  Write-Host "  2. 把导出的 JSON 拖到「导入网页数据.bat」"
  Write-Host ""
  exit 0
}
git commit -m $Message
if ($LASTEXITCODE -ne 0) { throw "git commit 失败" }

$remotes = @(git remote)
if ($remotes.Count -eq 0) {
  Write-Host "已提交到本地，但还没有配置远程仓库。"
  Write-Host "配置一次：git remote add origin <你的仓库地址>"
  Write-Host "然后执行：git push -u origin main"
  exit 0
}

Write-Host "3/3 上传 ..."
$branch = (git branch --show-current).Trim()
git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  git push -u origin $branch
} else {
  git push
}
if ($LASTEXITCODE -ne 0) { throw "git push 失败，请检查网络/权限" }
Write-Host "完成。"