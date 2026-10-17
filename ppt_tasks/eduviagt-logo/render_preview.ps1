param(
  [Parameter(Mandatory=$true)][string]$Pptx,
  [Parameter(Mandatory=$true)][string]$OutDir,
  [Parameter(Mandatory=$true)][string]$Prefix,
  [int]$Width = 1600,
  [int]$Height = 900
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

$ppt = New-Object -ComObject PowerPoint.Application
try {
  $pres = $ppt.Presentations.Open($Pptx, $true, $false, $false)
  $i = 1
  foreach ($slide in $pres.Slides) {
    $path = Join-Path $OutDir ("{0}{1:d2}.png" -f $Prefix, $i)
    $slide.Export($path, "PNG", $Width, $Height)
    $i++
  }
  $pres.Close()
  Write-Output ("exported {0} slides -> {1}" -f ($i - 1), $OutDir)
} finally {
  $ppt.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
