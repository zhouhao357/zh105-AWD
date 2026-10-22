param([string]$Path)
$ErrorActionPreference = 'Stop'
if (-not $Path) {
    $fname = '24001010105-' + [char]0x5468 + [char]0x6D69 + '.docx'
    $Path = Join-Path (Split-Path $PSScriptRoot -Parent) $fname
}
try {
    $w = New-Object -ComObject Word.Application
    $w.Visible = $false
    $w.DisplayAlerts = 0
    try {
        $d = $w.Documents.Open($Path, $false, $true, $false)
        $pages = $d.ComputeStatistics(2)
        $words = $d.ComputeStatistics(0)
        $imgs = $d.InlineShapes.Count
        $d.Close(0)
        Write-Output ("OK pages={0} words={1} images={2}" -f $pages, $words, $imgs)
    } catch {
        Write-Output ("FAIL: " + $_.Exception.Message)
    } finally {
        try { $w.Quit(0) } catch {}
    }
} catch {
    Write-Output ("FAIL-OUTER: " + $_.Exception.Message)
}
