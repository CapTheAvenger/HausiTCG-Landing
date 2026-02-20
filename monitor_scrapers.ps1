# Monitor Scrapers Status
# Zeigt live an, welche Scraper noch laufen

$scrapers = @(
    @{ Number = 1; Title = "1-City-Archetype"; Name = "City League Archetype"; Exe = "city_league_archetype_scraper.exe" },
    @{ Number = 2; Title = "2-Limitless-Online"; Name = "Limitless Online"; Exe = "limitless_online_scraper.exe" },
    @{ Number = 3; Title = "3-Tournament-JH"; Name = "Tournament JH"; Exe = "tournament_scraper_JH.exe" },
    @{ Number = 4; Title = "4-City-Analysis"; Name = "City League Analysis"; Exe = "city_league_analysis_scraper.exe" },
    @{ Number = 5; Title = "5-Current-Meta"; Name = "Current Meta Analysis"; Exe = "current_meta_analysis_scraper.exe" }
)

function Get-StatusBar {
    param(
        [bool]$IsRunning,
        [int]$Width = 20
    )
    if ($IsRunning) {
        return "[" + "█" * 5 + "░" * ($Width - 5) + "] RUNNING"
    } else {
        return "[" + "█" * $Width + "] ✓ DONE"
    }
}

function Show-Status {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "                   SCRAPER STATUS MONITOR" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    
    $runningCount = 0
    $completedCount = 0
    
    foreach ($scraper in $scrapers) {
        # Check if process is still running
        $process = Get-Process | Where-Object { $_.ProcessName -eq $scraper.Exe.Replace('.exe', '') }
        $isRunning = $process -ne $null
        
        if ($isRunning) {
            $runningCount++
            $statusBar = Get-StatusBar $true
            $status = "● RUNNING"
            $color = "Yellow"
        } else {
            $completedCount++
            $statusBar = Get-StatusBar $false
            $status = "✓ DONE"
            $color = "Green"
        }
        
        Write-Host "[" -NoNewline
        Write-Host "$($scraper.Number)/5" -NoNewline -ForegroundColor Cyan
        Write-Host "] $($scraper.Name)" -NoNewline
        Write-Host " " * (30 - $scraper.Name.Length) -NoNewline
        Write-Host "$statusBar " -NoNewline -ForegroundColor $color
        Write-Host ""
    }
    
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "Running: $runningCount | Completed: $completedCount | Total: 5" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Letztes Update: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    
    return $runningCount
}

# Main monitoring loop
$maxWaitTime = 1800  # 30 minutes timeout
$elapsedTime = 0
$checkInterval = 3   # Check every 3 seconds

Write-Host "Starte Monitoring..."
Start-Sleep -Seconds 1

while ($elapsedTime -lt $maxWaitTime) {
    $runningCount = Show-Status
    
    if ($runningCount -eq 0) {
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "                    🎉 ALLE SCRAPER FERTIG! 🎉" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Start-Sleep -Seconds 2
        break
    }
    
    Start-Sleep -Seconds $checkInterval
    $elapsedTime += $checkInterval
}

# Final status if timeout reached
if ($elapsedTime -ge $maxWaitTime) {
    Write-Host ""
    Write-Host "⚠️  TIMEOUT: Monitoring nach 30 Minuten beendet" -ForegroundColor Red
    Write-Host "Die Scraper laufen möglicherweise noch im Hintergrund." -ForegroundColor Red
    Write-Host ""
}
