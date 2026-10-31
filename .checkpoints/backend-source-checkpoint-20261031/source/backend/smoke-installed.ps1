$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$java=Get-ChildItem 'C:/Program Files/Eclipse Adoptium' -Directory | Where-Object Name -Like '*21*' | Select-Object -First 1
if (!$java) { throw 'Java21 unavailable' }
$env:JAVA_HOME=$java.FullName
$env:SIMULATOR_CAPTURE_ENABLED='true'
$p=New-Object System.Diagnostics.Process
$p.StartInfo.FileName='cmd.exe'
$p.StartInfo.Arguments='/c backend.bat --simulator'
$p.StartInfo.WorkingDirectory=Join-Path $root 'build/install/backend/bin'
$p.StartInfo.UseShellExecute=$false
$p.StartInfo.RedirectStandardInput=$true
$p.StartInfo.RedirectStandardOutput=$true
$p.StartInfo.RedirectStandardError=$true
$p.StartInfo.CreateNoWindow=$true
[void]$p.Start()
function Read-Bytes($count) {
 $bytes=New-Object byte[] $count; $offset=0
 while($offset -lt $count) { $n=$p.StandardOutput.BaseStream.Read($bytes,$offset,$count-$offset); if($n -eq 0){throw 'Unexpected EOF'}; $offset+=$n }
 return ,$bytes
}
function Invoke-Frame($method,$params) {
 $body=[Text.Encoding]::UTF8.GetBytes((@{jsonrpc='2.0';id=[guid]::NewGuid().ToString();method=$method;params=$params;protocolVersion=1}|ConvertTo-Json -Compress -Depth 20))
 $head=[BitConverter]::GetBytes([int]$body.Length); [Array]::Reverse($head)
 $p.StandardInput.BaseStream.Write($head,0,4); $p.StandardInput.BaseStream.Write($body,0,$body.Length); $p.StandardInput.BaseStream.Flush()
 $h=Read-Bytes 4; [Array]::Reverse($h); $n=[BitConverter]::ToInt32($h,0)
 if($n -lt 1 -or $n -gt 1048576){throw 'Frame bound'}
 $b=Read-Bytes $n
 return ([Text.Encoding]::UTF8.GetString($b)|ConvertFrom-Json)
}
try {
 $health=Invoke-Frame 'health.check' @{}; if($health.result.status -ne 'ok'){throw 'Health failed'}
 $catalog=Invoke-Frame 'catalog.get' @{}; if($catalog.result.layouts.Count -ne 2){throw 'Catalog failed'}
 $sid=[guid]::NewGuid().ToString(); $gen=[guid]::NewGuid().ToString()
 $start=Invoke-Frame 'session.start' @{sessionId=$sid;generationId=$gen;commandId=[guid]::NewGuid().ToString();layoutId='strip-2'}
 $setup=Invoke-Frame 'session.confirmSetup' @{sessionId=$sid;generationId=$gen;commandId=[guid]::NewGuid().ToString()}
 if($setup.result.state -ne 'SELECTING_QUANTITY'){throw 'Setup failed'}
 $unknown=Invoke-Frame 'session.transition' @{sessionId=$sid;generationId=$gen;commandId=[guid]::NewGuid().ToString();targetState='DELIVERY'}
 if($unknown.error.code -ne -32601){throw 'Generic transition not rejected'}
 "installed health=$($health.result.status) pid=$($health.result.backendPid); catalogLayouts=$($catalog.result.layouts.Count); confirmSetup=$($setup.result.state); session.transition=$($unknown.error.code)"
 $p.StandardInput.Close(); if(!$p.WaitForExit(10000)){throw 'EOF timeout'}; if($p.ExitCode -ne 0){throw 'EOF nonzero'}
 "EOF exit=$($p.ExitCode)"
 Get-FileHash (Join-Path $root 'build/install/backend/lib/lesouvenir-v2-backend-foundation.jar') -Algorithm SHA256 | Format-List
 Get-Item (Join-Path $root 'build/install/backend/lib/lesouvenir-v2-backend-foundation.jar') | Select-Object FullName,LastWriteTimeUtc
} finally { if(!$p.HasExited){$p.Kill($true)}; $p.Dispose() }
