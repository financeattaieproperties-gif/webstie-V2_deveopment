param([Parameter(Mandatory=$true)][string]$OutputDirectory,[string]$PhpExecutable='php')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$output=[IO.Path]::GetFullPath($OutputDirectory)
if (Test-Path -LiteralPath $output) { throw 'Use a NEW output directory.' }
$forbidden=@('.php','.sql','.ini')
New-Item -ItemType Directory -Path $output | Out-Null
$web=Join-Path $output 'webroot'
New-Item -ItemType Directory -Path $web | Out-Null
foreach($role in @('callcenter','management')) {
    node (Join-Path $PSScriptRoot 'build-staff.mjs') --role $role --out (Join-Path $web $role)
    if($LASTEXITCODE -ne 0) { throw "Build failed: $role" }
    foreach($file in Get-ChildItem -LiteralPath (Join-Path $web $role) -Recurse -File -Force) {
        if($file.Extension -in $forbidden) { throw 'Backend file appeared inside a dashboard build.' }
    }
}
New-Item -ItemType Directory -Path (Join-Path $web 'staff-api') | Out-Null
foreach($name in @('index.php','.htaccess','paths.example.php')) { Copy-Item -LiteralPath (Join-Path $root "public/staff-api/$name") -Destination (Join-Path (Join-Path $web 'staff-api') $name) }
$private=Join-Path $output 'private-app'
New-Item -ItemType Directory -Path $private | Out-Null
foreach($relative in @('src/App.php','src/Domain.php','src/FirebaseAuth.php','config/config.example.php','bin/bootstrap-admin.php')) {
    $destination=Join-Path $private $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
    Copy-Item -LiteralPath (Join-Path $root "staff-service/$relative") -Destination $destination
}
New-Item -ItemType Directory -Path (Join-Path $output 'database') | Out-Null
foreach($sql in @('001-core.sql','010-callcenter.sql')) {
    Copy-Item -LiteralPath (Join-Path $root "staff-service/database/$sql") -Destination (Join-Path $output "database/$sql")
}
$firebase=Join-Path $root 'staff-service/config/firebase.local.php'
if (Test-Path -LiteralPath $firebase) {
    Copy-Item -LiteralPath $firebase -Destination (Join-Path $output 'firebase-settings.private.php')
}
Copy-Item -LiteralPath (Join-Path $root 'deployment/staff/README.md') -Destination (Join-Path $output 'README.md')
& $PhpExecutable (Join-Path $root 'staff-service/bin/bootstrap-admin.php') --out (Join-Path $output 'private-setup')
if($LASTEXITCODE -ne 0) { throw 'Private owner provisioning preparation failed; do not upload an incomplete package.' }
if(Test-Path -LiteralPath (Join-Path $web 'api')) { throw 'Protected V1 backend must never be included.' }
if(Test-Path -LiteralPath (Join-Path $web 'sales')) { throw 'Sales dashboard is excluded.' }
$manifest=foreach($file in Get-ChildItem -LiteralPath $output -Recurse -File -Force) {
    [pscustomobject]@{path=$file.FullName.Substring($output.Length+1).Replace('\','/');sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash;bytes=$file.Length}
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $output 'manifest.json') -Encoding UTF8
Write-Output "Staff test package: $output"
Write-Output 'Upload webroot contents only. Private app/config, SQL and login materials stay outside webroot. Nothing deployed.'
