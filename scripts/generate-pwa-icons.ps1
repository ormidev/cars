Add-Type -AssemblyName System.Drawing

function New-PwaIcon {
  param([int]$Size, [string]$OutputPath)

  $sourcePath = "$PSScriptRoot\..\public\carlogo.jpg"
  $source = [System.Drawing.Image]::FromFile($sourcePath)
  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($source, 0, 0, $Size, $Size)

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
  $source.Dispose()
}

New-PwaIcon -Size 192 -OutputPath "$PSScriptRoot\..\public\pwa-192.png"
New-PwaIcon -Size 512 -OutputPath "$PSScriptRoot\..\public\pwa-512.png"
