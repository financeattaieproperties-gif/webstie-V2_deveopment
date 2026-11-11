param(
    [Parameter(Mandatory = $true)]
    [string]$FrontendArchive
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$archivePath = (Resolve-Path -LiteralPath $FrontendArchive).Path
$releases = Join-Path $projectRoot 'releases'
if (!$archivePath.StartsWith($releases + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Use a verified frontend archive inside releases/.'
}
$name = 'staging-kit-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$kit = Join-Path $releases $name
node (Join-Path $PSScriptRoot 'prepare-staging.mjs') $kit
if ($LASTEXITCODE -ne 0) { throw 'Staging preparation failed.' }
Expand-Archive -LiteralPath $archivePath -DestinationPath (Join-Path $kit 'site')

$sourceHashes = Get-Content -LiteralPath (Join-Path $kit 'setup/backend-source-hashes.json') -Raw | ConvertFrom-Json
foreach ($record in $sourceHashes) {
    $target = Join-Path (Join-Path $kit 'site') $record.path
    if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) {
        throw "PHP source mismatch: $($record.path)"
    }
}
if (Test-Path -LiteralPath (Join-Path $kit 'site/api/db.php')) { throw 'Database credentials must not be packaged.' }
if (Test-Path -LiteralPath (Join-Path $kit 'site/uploads')) { throw 'Existing uploads must not be packaged.' }

# Include dotfiles and use portable ZIP paths for extraction on Linux cPanel.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = Join-Path $releases "$name.zip"
$writer = [IO.Compression.ZipFile]::Open($zip, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in Get-ChildItem -LiteralPath $kit -Recurse -File -Force) {
        $entryName = $file.FullName.Substring($kit.Length + 1).Replace('\', '/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($writer, $file.FullName, $entryName, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $writer.Dispose() }
$archive = [IO.Compression.ZipFile]::OpenRead($zip)
try {
    $entries = @($archive.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
    foreach ($required in @('site/.htaccess', 'site/.user.ini', 'site/index.html', 'site/admin/index.html', 'site/api/admin-login.php', 'setup/install.php', 'setup/01-schema.sql', 'setup/02-five-projects.sql')) {
        if ($required -notin $entries) { throw "Missing ZIP entry: $required" }
    }
    if ('site/api/db.php' -in $entries -or 'setup/config.php' -in $entries) { throw 'Unexpected credential file.' }
} finally { $archive.Dispose() }
Write-Output "Staging kit: $zip"
Write-Output "Verified $($sourceHashes.Count) unchanged PHP files. No server or database was contacted."
