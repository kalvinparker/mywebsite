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
    $desc = if ($r.description) { $r.description } else { '' }
    $url = $r.html_url
    $lang = if ($r.language) { $r.language } else { '' }
    $stars = $r.stargazers_count
    $updated = (Get-Date $r.updated_at).ToString('yyyy-MM-dd')

    $meta = "$lang · ★ $stars · updated $updated"
    if ($lang -eq '') { $meta = "★ $stars · updated $updated" }

    $items += "<li><a href=\"$url\" target=\"_blank\">$name</a><div class=\"proj-meta\">$desc<br/><span>$meta</span></div></li>"
}

# Read index
$indexFile = Join-Path -Path (Split-Path -Path $MyInvocation.MyCommand.Path -Parent) -ChildPath $IndexPath
$indexFile = Resolve-Path -Path $indexFile -ErrorAction Stop

$html = Get-Content -Raw -Path $indexFile

$startMarker = '<!-- PROJECTS: This section is managed by scripts/update_projects.ps1 -->'
$ulStart = '<ul class="projects" id="projects">'
$ulEnd = '</ul>'

$prefix, $suffix = $null, $null

if ($html -match "(?s)(.*)$startMarker(.*?)$ulStart(.*)$ulEnd(.*)") {
    $prefix = $matches[1] + $startMarker + "\n" + $ulStart
    $suffix = $matches[4]
} else {
    Write-Error "index.html does not contain the expected markers. Aborting."
    exit 2
}

$newList = $items -join "`n"
$newHtml = "$prefix`n$newList`n$ulEnd$`n$suffix"

Set-Content -Path $indexFile -Value $newHtml -Encoding UTF8

Write-Host "Updated projects in $indexFile"
