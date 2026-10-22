$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$work = Split-Path -Parent $base
$dataFile = Join-Path $base 'report-data.txt'
$name = '24001010105-' + [char]0x5468 + [char]0x6D69
$outDoc = Join-Path $work ($name + '.doc')
$outPdf = Join-Path $work ($name + '.pdf')

$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$doc.PageSetup.TopMargin = 56
$doc.PageSetup.BottomMargin = 56
$doc.PageSetup.LeftMargin = 62
$doc.PageSetup.RightMargin = 62
$sel = $word.Selection

function Set-Font($name, $size, $bold, $align) {
    $sel.Font.Name = $name
    $sel.Font.Size = [single]$size
    $sel.Font.Bold = [bool]$bold
    $sel.ParagraphFormat.Alignment = [int]$align
    $sel.ParagraphFormat.LeftIndent = [single]0
    $sel.ParagraphFormat.FirstLineIndent = [single]0
    $sel.ParagraphFormat.SpaceBefore = [single]0
    $sel.ParagraphFormat.SpaceAfter = [single]0
    $sel.ParagraphFormat.LineSpacingRule = 1
    $sel.ParagraphFormat.LineSpacing = [single]18
}

function Write-Para($text, $name, $size, $bold, $align, $after) {
    Set-Font $name $size $bold $align
    $sel.ParagraphFormat.SpaceAfter = [single]$after
    $sel.TypeText($text)
    $sel.TypeParagraph()
}

$lines = Get-Content -LiteralPath $dataFile -Encoding UTF8
$i = 0
while ($i -lt $lines.Count) {
    $line = $lines[$i]
    if ($line.StartsWith('##')) {
        $parts = $line -split '\|', 3
        $tag = $parts[0].Substring(2)
        $a1 = ''
        $a2 = ''
        if ($parts.Count -gt 1) { $a1 = $parts[1] }
        if ($parts.Count -gt 2) { $a2 = $parts[2] }
        switch ($tag) {
            'TITLE'    { Write-Para $a1 黑+体 22 $true 1 6 }
            'SUBTITLE' { Write-Para $a1 黑+体 16 $true 1 14 }
            'CENTER'   { Write-Para $a1 宋+体 11 $false 1 4 }
            'H1'       { Write-Para $a1 黑+体 15 $true 0 8 }
            'H2'       { Write-Para $a1 黑+体 12 $true 0 6 }
            'P'        { Write-Para $a1 宋+体 10.5 $false 3 6 }
            'CODE'     {
                $i++
                while ($i -lt $lines.Count -and -not $lines[$i].StartsWith('##')) {
                    Set-Font 'Consolas' 9 $false 0
                    $sel.ParagraphFormat.LeftIndent = [single]16
                    $sel.ParagraphFormat.SpaceAfter = [single]0
                    $sel.ParagraphFormat.LineSpacing = [single]13
                    $sel.ParagraphFormat.Shading.BackgroundPatternColor = 15790320
                    $sel.TypeText($lines[$i])
                    $sel.TypeParagraph()
                    $i++
                }
                $i--
                Set-Font 宋+体 10.5 $false 3
                $sel.ParagraphFormat.LeftIndent = [single]0
                $sel.ParagraphFormat.SpaceAfter = [single]6
                $sel.ParagraphFormat.Shading.BackgroundPatternColor = -16777216
            }
            'IMG'      {
                if (Test-Path -LiteralPath $a1) {
                    Set-Font 宋+体 10.5 $false 1
                    $sel.ParagraphFormat.SpaceAfter = [single]2
                    $sel.ParagraphFormat.SpaceBefore = [single]6
                    $null = $sel.InlineShapes.AddPicture($a1, $false, $true)
                    $sel.ParagraphFormat.Alignment = 1
                    $sel.TypeParagraph()
                    Write-Para $a2 宋+体 9 $false 1 12
                } else {
                    Write-Para ('[missing image: ' + $a1 + ']') 宋+体 10.5 $false 1 6
                }
            }
        }
    }
    $i++
}
$doc.Sections.Item(1).Footers.Item(1).PageNumbers.Add(2, $true) | Out-Null
if (Test-Path -LiteralPath $outDoc) { Remove-Item -LiteralPath $outDoc -Force }
$doc.SaveAs2($outDoc, 0)
if (Test-Path -LiteralPath $outPdf) { Remove-Item -LiteralPath $outPdf -Force }
$doc.ExportAsFixedFormat($outPdf, 17)
$doc.Close(0)
$word.Quit()
Write-Output ('DONE -> ' + $outDoc)
