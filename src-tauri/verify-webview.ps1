$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$env:V2_JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot'
$env:TEMP = "$PSScriptRoot\.tmp"
$env:TMP = $env:TEMP
$hostProcess = Start-Process "$PSScriptRoot\target\debug\le-souvenir-v2.exe" -PassThru
try {
  $deadline = (Get-Date).AddSeconds(30)
  do {
    Start-Sleep -Milliseconds 500
    $hostProcess.Refresh()
    if ($hostProcess.HasExited) { throw 'Host exited before window initialization' }
  } until ($hostProcess.MainWindowHandle -ne 0 -or (Get-Date) -gt $deadline)
  $root = [System.Windows.Automation.AutomationElement]::FromHandle($hostProcess.MainWindowHandle)
  "HOST PID=$($hostProcess.Id) HWND=$($hostProcess.MainWindowHandle)"
  function Elements { $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition) }
  do {
    $button = @(Elements | Where-Object { $_.Current.Name -eq 'Check JVM bridge' }) | Select-Object -First 1
    if ($button) { break }
    Start-Sleep -Milliseconds 500
  } until ((Get-Date) -gt $deadline)
  if (!$button) { Elements | ForEach-Object { "$($_.Current.ControlType.ProgrammaticName): $($_.Current.Name)" }; throw 'Mounted React button not accessible through UI Automation' }
  "INVOKE UIA button=$($button.Current.Name)"
  $pattern = $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
  $pattern.Invoke()
  $deadline = (Get-Date).AddSeconds(20)
  do {
    Start-Sleep -Milliseconds 300
    $names = @(Elements | ForEach-Object { $_.Current.Name })
    if ($names -contains 'JVM responded · simulator confirmed') { break }
  } until ((Get-Date) -gt $deadline)
  'RENDERED UI:'
  $names | Where-Object { $_ } | Select-Object -Unique
  if ($names -notcontains 'JVM responded · simulator confirmed') { throw 'No successful real WebView health response' }
  $children = @(Get-CimInstance Win32_Process -Filter "ParentProcessId=$($hostProcess.Id)")
  $launchers = @($children | Where-Object Name -eq 'cmd.exe')
  $jvms = @($launchers | ForEach-Object { Get-CimInstance Win32_Process -Filter "ParentProcessId=$($_.ProcessId)" } | Where-Object Name -eq 'java.exe')
  if ($jvms.Count -ne 1) { throw "Expected one active owned JVM, got $($jvms.Count)" }
  $javaPid = $jvms[0].ProcessId
  "ACTIVE JVM PID=$javaPid launcher=$($launchers[0].ProcessId)"
  if ($names -notcontains "$javaPid") { throw 'Rendered backend PID differs from actual owned JVM' }
  "CLOSE accepted=$($hostProcess.CloseMainWindow())"
  if (!$hostProcess.WaitForExit(15000)) { throw 'Host failed to close within 15 seconds' }
  "HOST EXIT=$($hostProcess.ExitCode)"
  Start-Sleep -Milliseconds 500
  if (Get-Process -Id $javaPid -ErrorAction SilentlyContinue) { throw 'Owned JVM survived normal window close' }
  "JVM PID=$javaPid terminated=True"
} finally {
  if (!$hostProcess.HasExited) { $hostProcess.CloseMainWindow() | Out-Null; $hostProcess.WaitForExit(15000) | Out-Null }
}
