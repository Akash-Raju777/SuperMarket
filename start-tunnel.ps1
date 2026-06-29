$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "ssh"
$processInfo.Arguments = "-o StrictHostKeyChecking=no -R 80:127.0.0.1:8080 nokey@localhost.run"
$processInfo.RedirectStandardOutput = $true
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$process.Start() | Out-Null

$reader = $process.StandardOutput
while (-not $reader.EndOfStream) {
    $line = $reader.ReadLine()
    Write-Host $line
    if ($line -match "https://[a-zA-Z0-9\-\.]+") {
        $url = $Matches[0]
        Write-Host "Detected Tunnel URL: $url"
        try {
            $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($url)
            $request = [System.Net.WebRequest]::Create("https://ntfy.sh/supermarket_akash_tunnel_topic")
            $request.Method = "POST"
            $request.ContentType = "text/plain"
            $request.ContentLength = $bodyBytes.Length
            $stream = $request.GetRequestStream()
            $stream.Write($bodyBytes, 0, $bodyBytes.Length)
            $stream.Close()
            $response = $request.GetResponse()
            $response.Close()
            Write-Host "Published Tunnel URL to ntfy.sh successfully!"
        } catch {
            Write-Host "Failed to publish URL to ntfy.sh: $_"
        }
    }
}
$process.WaitForExit()
