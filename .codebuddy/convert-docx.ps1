param([string]$Path, [string]$Log)
$ErrorActionPreference = 'Stop'
$dir = Split-Path $PSScriptRoot -Parent
if (-not $Log) { $Log = Join-Path $PSScriptRoot 'convert.log' }
function Say($m) { $t = (Get-Date).ToString('HH:mm:ss'); Add-Content -Path $Log -Value ("[{0}] {1}" -f $t, $m) -Encoding UTF8 }
Set-Content -Path $Log -Value "" -Encoding UTF8
if (-not $Path) {
    $fname = '24001010105-' + [char]0x5468 + [char]0x6D69 + '.docx'
    $Path = Join-Path $dir $fname
}
$stem = [System.IO.Path]::GetFileNameWithoutExtension($Path)
$docPath = Join-Path $dir ($stem + '.doc')
$pdfPath = Join-Path $dir ($stem + '.pdf')
Say ("start file=" + $Path)
try {
    $w = New-Object -ComObject Word.Application
    $w.Visible = $false
    $w.DisplayAlerts = 0
    Say "word started"
    $d = $w.Documents.Open($Path, $false, $false, $false)
    Say ("opened, pages=" + $d.ComputeStatistics(2))
    if (Test-Path $docPath) { Remove-Item $docPath -Force }
    $d.SaveAs2($docPath, 0)
    Say ("saved doc: " + (Test-Path $docPath))
    if (Test-Path $pdfPath) { Remove-Item $pdfPath -Force }
    $d.ExportAsFixedFormat($pdfPath, 17)
    Say ("exported pdf: " + (Test-Path $pdfPath))
    $d.Close(0)
    $w.Quit(0)
    Say "done"
} catch {
    Say ("FAIL: " + $_.Exception.Message)
    try { $w.Quit(0) } catch {}
}
