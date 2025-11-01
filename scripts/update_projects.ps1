param(
    [string]$User = "kalvinparker",
    [string]$IndexPath = "..\index.html"
)

# Fetch public repos for a user and update the projects list in index.html
$api = "https://api.github.com/users/$User/repos?per_page=200&type=owner&sort=updated"
Write-Host "Fetching repos from $api"

try {
    $repos = Invoke-RestMethod -Uri $api -UseBasicParsing -Headers @{ 'User-Agent' = 'update_projects_script' }
} catch {
    Write-Error "Failed to fetch repos: $_"
    exit 1
}

if (-not $repos) {
    Write-Host "No repos found for $User"
    exit 0
}

$items = @()
foreach ($r in $repos | Sort-Object -Property updated_at -Descending) {
    $name = $r.name
    $desc = if ($r.description) { ($r.description -replace "[\r\n]+"," ") } else { '' }
    $url = $r.html_url
    $lang = if ($r.language) { $r.language } else { '' }
    $stars = $r.stargazers_count
    $updated = (Get-Date $r.updated_at).ToString('yyyy-MM-dd')

    if ($lang -ne '') { $meta = "$lang · ★ $stars · updated $updated" } else { $meta = "★ $stars · updated $updated" }

    # Build the list item using double-quote escaping to avoid parsing issues
    $li = '<li><a href="' + $url + '" target="_blank">' + $name + '</a>'
    $li += '<div class="proj-meta">' + $desc + '<br/><span>' + $meta + '</span></div></li>'
    $items += $li
}

# Resolve index path relative to script
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$indexFile = Join-Path -Path $scriptDir -ChildPath $IndexPath
try { $indexFile = Resolve-Path -Path $indexFile -ErrorAction Stop } catch { Write-Error "Cannot find index file at $indexFile"; exit 2 }

$html = Get-Content -Raw -Path $indexFile

$startMarker = '<!-- PROJECTS: This section is managed by scripts/update_projects.ps1 -->'
$ulStart = '<ul class="projects" id="projects">'
$ulEnd = '</ul>'

# Find positions rather than relying on regex — more robust for HTML blobs
$startPos = $html.IndexOf($startMarker)
if ($startPos -lt 0) { Write-Error "Start marker not found in index.html"; exit 3 }

$ulStartPos = $html.IndexOf($ulStart, $startPos)
if ($ulStartPos -lt 0) { Write-Error "UL start not found after marker"; exit 4 }

$ulEndPos = $html.IndexOf($ulEnd, $ulStartPos)
if ($ulEndPos -lt 0) { Write-Error "UL end not found after UL start"; exit 5 }

$prefix = $html.Substring(0, $ulStartPos + $ulStart.Length)
$suffix = $html.Substring($ulEndPos + $ulEnd.Length)

$newList = $items -join "`n"

$newHtml = $prefix + "`n" + $newList + "`n" + $ulEnd + $suffix

Set-Content -Path $indexFile -Value $newHtml -Encoding UTF8

Write-Host "Updated projects in $indexFile"
