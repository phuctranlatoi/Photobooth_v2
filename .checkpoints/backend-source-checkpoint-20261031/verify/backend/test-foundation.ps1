$ErrorActionPreference = 'Stop'
# Invoke only this V2-local distribution; never searches for a V1 wrapper.
$root = $PSScriptRoot
$env:TEMP = Join-Path $root '.tmp'
$env:TMP = $env:TEMP
$env:GRADLE_USER_HOME = Join-Path $root '.gradle-user-home'
$homePath = Join-Path $root '.toolchain-home'
$env:JAVA_TOOL_OPTIONS = "-Djava.io.tmpdir=$env:TEMP -Duser.home=$homePath"
New-Item -ItemType Directory -Force $env:TEMP,$env:GRADLE_USER_HOME,$homePath | Out-Null
$gradle = Join-Path $root '.toolchain/gradle-8.14.3/bin/gradle.bat'
if (!(Test-Path $gradle)) { throw 'V2-local Gradle 8.14.3 distribution missing; do not use V1 wrapper.' }
& $gradle --no-daemon --project-dir $root --project-cache-dir (Join-Path $root '.gradle-project') test
exit $LASTEXITCODE
