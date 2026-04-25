# Simple PowerShell HTTP server for static files
param(
    [string]$Path = "wwwroot",
    [int]$Port = 8000
)

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

Write-Host "Starting simple HTTP server on $prefix" -ForegroundColor Green
Write-Host "Serving files from: $Path" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Cyan

try {
    $listener.Start()
    
    while ($true) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $filePath = $request.Url.LocalPath
        if ($filePath -eq "/") {
            $filePath = "/index.html"
        }
        
        $fullPath = Join-Path $Path $filePath.TrimStart('/')
        
        Write-Host "$($request.HttpMethod) $filePath" -ForegroundColor Gray
        
        if (Test-Path $fullPath -PathType Leaf) {
            $content = Get-Content $fullPath -Raw -Encoding UTF8
            $extension = [System.IO.Path]::GetExtension($fullPath).ToLower()
            
            # Set content type
            $contentType = "text/plain"
            switch ($extension) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".css"  { $contentType = "text/css; charset=utf-8" }
                ".js"   { $contentType = "application/javascript; charset=utf-8" }
                ".json" { $contentType = "application/json; charset=utf-8" }
                ".png"  { $contentType = "image/png" }
                ".jpg"  { $contentType = "image/jpeg" }
                ".jpeg" { $contentType = "image/jpeg" }
                ".gif"  { $contentType = "image/gif" }
            }
            
            $response.ContentType = $contentType
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
            $notFound = "<html><body><h1>404 - Not Found</h1><p>The requested file '$filePath' was not found.</p></body></html>"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $response.ContentType = "text/html; charset=utf-8"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        $response.Close()
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    $listener.Stop()
    Write-Host "`nServer stopped." -ForegroundColor Yellow
}