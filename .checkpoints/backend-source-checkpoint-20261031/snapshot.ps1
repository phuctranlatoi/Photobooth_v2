$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$expected = 'E:\HK1_2026_2027\PhotoboothDesktop_v2'
if ($root.TrimEnd('\') -ine $expected) { throw 'Unexpected V2 workspace root' }
$snapshot = Join-Path $PSScriptRoot 'source'
$verify = Join-Path $PSScriptRoot 'verify'
$manifest = Join-Path $PSScriptRoot 'manifest.json'
if ((Test-Path $snapshot) -or (Test-Path $verify) -or (Test-Path $manifest)) { throw 'Checkpoint output already exists; refusing overwrite' }

$files = [System.Collections.Generic.List[string]]::new()
function Add-Tree([string] $relative, [string[]] $extensions) {
    $entry = Join-Path $root $relative
    if (!(Test-Path -LiteralPath $entry -PathType Container)) { return }
    function Walk([string] $directory, [string[]] $allowed) {
        foreach ($item in (Get-ChildItem -LiteralPath $directory -Force | Sort-Object Name)) {
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Linked source entry rejected: $($item.FullName)" }
            if ($item.PSIsContainer) { Walk $item.FullName $allowed }
            elseif ($allowed -contains $item.Extension.ToLowerInvariant()) {
                if (!$item.FullName.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Source escaped V2 root' }
                $files.Add($item.FullName.Substring($root.Length + 1).Replace('\','/'))
            }
        }
    }
    Walk $entry $extensions
}
Add-Tree 'backend/src' @('.kt','.kts','.java','.xml','.properties','.json','.txt')
Add-Tree 'frontend/src' @('.ts','.tsx','.js','.jsx','.css','.html','.json','.svg')
Add-Tree 'src-tauri/src' @('.rs','.toml')
Add-Tree 'tests' @('.ps1','.ts','.tsx','.js','.jsx','.rs','.kt','.py','.md')
Add-Tree 'docs' @('.md')
Add-Tree 'agent_templates' @('.md')
foreach ($relative in @('AGENTS.md','backend/build.gradle.kts','backend/settings.gradle.kts','backend/test-foundation.ps1','backend/smoke-installed.ps1','frontend/package.json','frontend/package-lock.json','frontend/index.html','frontend/tsconfig.json','frontend/vite.config.ts','frontend/postcss.config.js','frontend/eslint.config.js','src-tauri/Cargo.toml','src-tauri/Cargo.lock','src-tauri/build.rs','src-tauri/tauri.conf.json','src-tauri/capabilities/default.json')) {
    $item = Get-Item -LiteralPath (Join-Path $root $relative) -ErrorAction SilentlyContinue
    if ($null -eq $item) { continue }
    if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Invalid allowlisted file: $relative" }
    $files.Add($relative)
}
$entries = [System.Collections.Generic.List[object]]::new()
foreach ($relative in @($files | Sort-Object -Unique)) {
    $original = Join-Path $root $relative
    $copy = Join-Path $snapshot $relative
    $restored = Join-Path $verify $relative
    $before = (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash.ToLowerInvariant()
    New-Item -ItemType Directory -Path (Split-Path $copy) -Force | Out-Null
    Copy-Item -LiteralPath $original -Destination $copy -ErrorAction Stop
    New-Item -ItemType Directory -Path (Split-Path $restored) -Force | Out-Null
    Copy-Item -LiteralPath $copy -Destination $restored -ErrorAction Stop
    $after = (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash.ToLowerInvariant()
    $copied = (Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash.ToLowerInvariant()
    $verified = (Get-FileHash -LiteralPath $restored -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($before -ne $after -or $before -ne $copied -or $before -ne $verified) { throw "SHA256 mismatch: $relative" }
    $entries.Add([ordered]@{ path=$relative; sha256=$before; bytes=(Get-Item -LiteralPath $original).Length; copySha256=$copied; verifySha256=$verified })
}
if ($entries.Count -eq 0) { throw 'Empty source checkpoint rejected' }
$record = [ordered]@{
    workspace=$root; createdUtc=[DateTime]::UtcNow.ToString('o'); scope='Current dirty V2 source only; no V1 or runtime data'
    excluded=@('.git','node_modules','build','target','dist','caches','runtime backend/config JSON','all .env','photos','models','generated images','logs','customer data')
    count=$entries.Count; files=@($entries)
}
$json = ConvertTo-Json -InputObject $record -Depth 8
[IO.File]::WriteAllText($manifest, $json + "`n", [Text.UTF8Encoding]::new($false))
$check = ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($manifest))
if ($check.count -ne $entries.Count -or $check.files.Count -ne $entries.Count) { throw 'Manifest roundtrip failed' }
$hash = (Get-FileHash -LiteralPath $manifest -Algorithm SHA256).Hash.ToLowerInvariant()
Write-Output "ROOT=$root"
Write-Output "COUNT=$($entries.Count)"
Write-Output "MANIFEST_SHA256=$hash"
Write-Output "TEST_SOURCE_SHA256=$((@($entries | Where-Object { $_.path -eq 'backend/src/test/kotlin/com/lesouvenir/v2/ipc/SimulatorSessionTest.kt' })[0]).sha256)"
Write-Output "HARNESS_SHA256=$((@($entries | Where-Object { $_.path -eq 'backend/test-foundation.ps1' })[0]).sha256)"
Write-Output 'ORIGINAL_COPY_VERIFY_SHA256=ALL_MATCH'
