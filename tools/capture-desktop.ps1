# Capture desktop pixels ONLY with explicit foreground-window title check.
# Example: powershell -File .\tools\capture-desktop.ps1 -TitleContains 'LE SOUVENIR'
param([string]$TitleContains = 'Photobooth')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public class ActiveWindowTitle {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
'@
$titleBuffer = New-Object System.Text.StringBuilder 1024
[void][ActiveWindowTitle]::GetWindowText([ActiveWindowTitle]::GetForegroundWindow(),$titleBuffer,1024)
$title = $titleBuffer.ToString()
if ($title.IndexOf($TitleContains,[System.StringComparison]::OrdinalIgnoreCase) -lt 0) { throw "Foreground title '$title' does not include '$TitleContains'. Refusing to capture unrelated/private windows." }
$project = Split-Path -Parent $PSScriptRoot
if ((Split-Path -Leaf $project) -ne 'PhotoboothDesktop_v2') { throw 'V2 path required.' }
$outdir = Join-Path $project 'artifacts\ui-qa'
New-Item -ItemType Directory -Path $outdir -Force | Out-Null
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
  $path = Join-Path $outdir ('tauri-window-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.png')
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "Saved $path (foreground: $title; desktop screenshot only; does not verify clicks)."
} finally { $graphics.Dispose(); $bitmap.Dispose() }
