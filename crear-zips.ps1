param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot 'paquetes')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Test-IncludedFile {
  param([string]$RelativePath)

  $segments = $RelativePath -split '[\\/]'
  foreach ($segment in $segments) {
    if ($segment -in @('.git', 'node_modules', 'credentials', 'dist', '.vite', 'test-results')) {
      return $false
    }
  }

  $fileName = [IO.Path]::GetFileName($RelativePath)
  if (($fileName -eq '.env' -or $fileName -like '.env.*') -and $fileName -ne '.env.example') {
    return $false
  }
  if ($fileName -like '*.log' -or $fileName -like '*.zip') {
    return $false
  }

  return $true
}

if (-not (Test-Path -LiteralPath $OutputDirectory)) {
  New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}
$resolvedOutputDirectory = (Resolve-Path -LiteralPath $OutputDirectory).Path

foreach ($project in @('frontend', 'backend')) {
  $projectRoot = Join-Path $PSScriptRoot $project
  if (-not (Test-Path -LiteralPath $projectRoot -PathType Container)) {
    throw "No se encontró el directorio requerido: $projectRoot"
  }

  $archivePath = Join-Path $resolvedOutputDirectory "$project.zip"
  $archiveStream = [IO.File]::Open($archivePath, [IO.FileMode]::Create)
  try {
    $archive = New-Object IO.Compression.ZipArchive(
      $archiveStream,
      [IO.Compression.ZipArchiveMode]::Create,
      $false
    )
    try {
      Get-ChildItem -LiteralPath $projectRoot -Recurse -File -Force | ForEach-Object {
        $relativePath = $_.FullName.Substring($projectRoot.Length).TrimStart('\', '/')
        if (Test-IncludedFile $relativePath) {
          $entryName = "$project/$($relativePath -replace '\\', '/')"
          $entry = $archive.CreateEntry($entryName, [IO.Compression.CompressionLevel]::Optimal)
          $inputStream = [IO.File]::OpenRead($_.FullName)
          try {
            $entryStream = $entry.Open()
            try {
              $inputStream.CopyTo($entryStream)
            }
            finally {
              $entryStream.Dispose()
            }
          }
          finally {
            $inputStream.Dispose()
          }
        }
      }
    }
    finally {
      $archive.Dispose()
    }
  }
  finally {
    $archiveStream.Dispose()
  }

  $entries = [IO.Compression.ZipFile]::OpenRead($archivePath)
  try {
    if ($entries.Entries.Count -eq 0) {
      throw "El archivo generado está vacío: $archivePath"
    }
    foreach ($entry in $entries.Entries) {
      if ($entry.FullName -match '(^|/)(node_modules|credentials|\.git|dist|\.vite|test-results)(/|$)' -or
        $entry.FullName -match '(^|/)\.env(\..*)?$' -and $entry.FullName -notmatch '(^|/)\.env\.example$') {
        throw "Se detectó un archivo excluido dentro del ZIP: $($entry.FullName)"
      }
    }
    Write-Output "$archivePath ($($entries.Entries.Count) archivos)"
  }
  finally {
    $entries.Dispose()
  }
}
