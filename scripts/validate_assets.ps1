# Validate local asset references in index.html
$index = 'd:\My Documents\Projects\mywebsite\index.html'
Write-Output "Validating $index"
$html = Get-Content -Raw -Path $index
$matches = [regex]::Matches($html,'(?:src|href)="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$local = $matches | Where-Object { $_ -notmatch '^(https?:)?//' } | Select-Object -Unique
if (-not $local) { Write-Output "No local asset references found."; exit 0 }
foreach ($ref in $local) {
  if ($ref.StartsWith('/')) { $path = Join-Path (Get-Location).Path $ref }
  else { $path = Join-Path 'd:\My Documents\Projects\mywebsite' $ref }
  $exists = Test-Path $path
  Write-Output "$ref -> $path : $exists"
}
Write-Output 'Done'
