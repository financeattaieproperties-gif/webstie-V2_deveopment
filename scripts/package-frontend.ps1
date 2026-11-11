# Package only static frontend files. Never upload the raw dist directory to V1.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $projectRoot 'dist'
if (!(Test-Path -LiteralPath (Join-Path $dist 'index.html'))) {
    throw 'Build first: npm run build'
}

$releaseRoot = Join-Path $projectRoot 'releases'
$releaseName = 'frontend-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$stage = Join-Path $releaseRoot $releaseName
New-Item -ItemType Directory -Path $stage | Out-Null

# Explicit allowlist excludes API, PHP, SQL, uploads, SEO data, and server config.
$allowed = @('index.html', 'logo.png', 'assets', 'fonts', 'admin/index.html', 'admin/assets')
foreach ($relative in $allowed) {
    $source = Join-Path $dist $relative
    if (!(Test-Path -LiteralPath $source)) {
        throw "Missing expected build output: $relative"
    }
    $destination = Join-Path $stage $relative
    New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination -Recurse
}

$files = @(Get-ChildItem -LiteralPath $stage -Recurse -File -Force)
foreach ($file in $files) {
    if ($file.Extension -in @('.php', '.sql', '.ini') -or $file.Name.StartsWith('.')) {
        throw "Protected file found in package: $($file.Name)"
    }
}

$manifest = foreach ($file in $files) {
    [PSCustomObject]@{
        path = $file.FullName.Substring($stage.Length + 1).Replace('\', '/')
        sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
        bytes = $file.Length
    }
}
$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $releaseRoot "$releaseName-manifest.json") -Encoding UTF8
$archive = Join-Path $releaseRoot "$releaseName.zip"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$writer = [IO.Compression.ZipFile]::Open($archive, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        $entryName = $file.FullName.Substring($stage.Length + 1).Replace('\', '/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($writer, $file.FullName, $entryName, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $writer.Dispose() }
Write-Output "Frontend package: $archive"
Write-Output "Verified $($files.Count) static files. Production was not changed."
