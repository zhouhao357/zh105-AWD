param([string]$Path)
$ErrorActionPreference = 'Stop'
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
$out = Join-Path $env:TEMP ('zh-check-' + [guid]::NewGuid().ToString('N') + '.txt')
$err = $out + '.err'
$argList = @('-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $PSScriptRoot 'check-docx.ps1'))
if ($Path) { $argList += @('-Path', $Path) }
$p = Start-Process powershell -ArgumentList $argList -PassThru -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden
$done = $p.WaitForExit(150000)
if (-not $done) {
    try { $p.Kill() } catch {}
    Write-Output 'TIMEOUT'
} else {
    $txt = ''
    if (Test-Path $out) { $txt = (Get-Content $out -Raw) }
    if ($txt) { Write-Output $txt.Trim() }
    if (Test-Path $err) {
        $e = (Get-Content $err -Raw)
        if ($e -and $e.Trim()) { Write-Output ('STDERR: ' + $e.Trim()) }
    }
}
Start-Sleep -Seconds 1
$after = @(Get-Process WINWORD -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
foreach ($procId in $after) { if ($before -notcontains $procId) { try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {} } }
Remove-Item $out, $err -Force -ErrorAction SilentlyContinue
