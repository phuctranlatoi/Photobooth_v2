param(
    [string]$JavaHome = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot',
    [string]$HostExe = (Join-Path $PSScriptRoot '..\..\src-tauri\target\debug\le-souvenir-v2.exe'),
    [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Wait-Until([scriptblock]$Condition, [string]$Description) {
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    do {
        $value = & $Condition
        if ($null -ne $value -and $value -ne $false) { return $value }
        Start-Sleep -Milliseconds 100
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "Timed out waiting for $Description"
}

if (-not (Test-Path -LiteralPath (Join-Path $JavaHome 'bin\java.exe') -PathType Leaf)) {
    throw "Java 21 executable not found under JavaHome: $JavaHome"
}
if (-not (Test-Path -LiteralPath $HostExe -PathType Leaf)) {
    throw "Tauri host executable not found: $HostExe"
}

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$env:V2_JAVA_HOME = $JavaHome
$hostProcess = Start-Process -FilePath $HostExe -WorkingDirectory (Split-Path $HostExe) -PassThru
$backendPid = $null

try {
    $window = Wait-Until {
        $hostProcess.Refresh()
        if ($hostProcess.MainWindowHandle -ne [IntPtr]::Zero) {
            [System.Windows.Automation.AutomationElement]::FromHandle($hostProcess.MainWindowHandle)
        }
    } 'the native Tauri window'

    if ($window.Current.Name -and $window.Current.Name -notmatch '^LE SOUVENIR . V2 architecture proof$') {
        throw "Unexpected native window title: $($window.Current.Name)"
    }

    $buttonCondition = New-Object System.Windows.Automation.AndCondition(
        (New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
            [System.Windows.Automation.ControlType]::Button)),
        (New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::NameProperty, 'Check JVM bridge')))
    $button = Wait-Until {
        $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $buttonCondition)
    } 'the React-rendered Check JVM bridge button in WebView2'

    $invoke = $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
    $invoke.Invoke()

    $successCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty, 'JVM responded · simulator confirmed')
    [void](Wait-Until {
        $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $successCondition)
    } 'the React success status after Tauri invoke')

    $pidLabelCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty, 'Backend process')
    $pidLabel = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $pidLabelCondition)
    if ($null -eq $pidLabel) { throw 'React health details did not expose Backend process' }
    $parent = [System.Windows.Automation.TreeWalker]::ControlViewWalker.GetParent($pidLabel)
    $texts = $parent.FindAll([System.Windows.Automation.TreeScope]::Descendants,
        (New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
            [System.Windows.Automation.ControlType]::Text)))
    foreach ($text in $texts) {
        if ($text.Current.Name -match '^\d+$') { $backendPid = [int]$text.Current.Name; break }
    }
    if (-not $backendPid) { throw 'Could not read the JVM PID rendered by React' }
    [void](Get-Process -Id $backendPid -ErrorAction Stop)

    $windowPattern = $window.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern)
    $windowPattern.Close()
    if (-not $hostProcess.WaitForExit(10000)) { throw 'Tauri host did not exit after native window close' }
    [void](Wait-Until {
        if ($null -eq (Get-Process -Id $backendPid -ErrorAction SilentlyContinue)) { return $true }
        return $false
    } 'JVM PID termination after window close')

    [pscustomobject]@{
        Result = 'PASS-SIMULATED'
        HostPid = $hostProcess.Id
        BackendPid = $backendPid
        NativeWindow = $window.Current.Name
        WebViewControl = 'Check JVM bridge'
        HealthStatus = 'JVM responded · simulator confirmed'
        HostExitCode = $hostProcess.ExitCode
        BackendTerminated = $true
    } | Format-List
}
finally {
    if ($backendPid) { Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue }
    if (-not $hostProcess.HasExited) { Stop-Process -Id $hostProcess.Id -Force -ErrorAction SilentlyContinue }
}
