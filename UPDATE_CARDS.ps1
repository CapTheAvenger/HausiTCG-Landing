#!/usr/bin/env powershell
<#
Update Pokemon TCG Card Database - PowerShell Version
======================================================
Unified interface for updating card database

Usage:
  .\UPDATE_CARDS.ps1                   # Interactive menu
  .\UPDATE_CARDS.ps1 -Mode auto        # Auto-detect mode
  .\UPDATE_CARDS.ps1 -Mode full        # Full download
  .\UPDATE_CARDS.ps1 -Mode incremental # Incremental update
#>

param(
    [ValidateSet("auto", "full", "incremental")]
    [string]$Mode = "menu"
)

function Show-Menu {
    Write-Host "`n" -NoNewline
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host "UPDATE POKEMON TCG CARD DATABASE" -ForegroundColor Cyan
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ENGLISH CARDS:" -ForegroundColor Yellow
    Write-Host "  1 = Auto-detect (incremental if exists, full otherwise)"
    Write-Host "  2 = Full download (3-4 hours)"
    Write-Host "  3 = Incremental update (new cards only, 5-10 minutes)"
    Write-Host ""
    Write-Host "JAPANESE CARDS (4 latest sets only):" -ForegroundColor Yellow
    Write-Host "  4 = Download/Update Japanese cards (30-45 minutes)"
    Write-Host ""
    Write-Host "  q = Exit"
    Write-Host ""
}

function Test-DatabaseExists {
    param([string]$Type = "english")
    
    if ($Type -eq "japanese") {
        return Test-Path "data\japanese_cards_database.csv"
    } else {
        return Test-Path "data\all_cards_database.csv"
    }
}

function Start-Update {
    param([string]$Type = "english", [string]$UpdateMode = "auto")
    
    if ($Type -eq "english") {
        if ($UpdateMode -eq "auto") {
            if (Test-DatabaseExists -Type "english") {
                Write-Host "[INFO] Existing English database found - using INCREMENTAL mode" -ForegroundColor Green
                Write-Host "[INFO] (Use Mode=full to force complete redownload)"
                $UpdateMode = "incremental"
            } else {
                Write-Host "[INFO] No existing English database - using FULL mode" -ForegroundColor Green
                $UpdateMode = "full"
            }
        }
        Write-Host ""
        python update_cards.py --type english --mode $UpdateMode
    } else {
        Write-Host ""
        python update_cards.py --type japanese
    }
    
    if ($LASTEXITCODE -eq 0) {
        $dbFile = if ($Type -eq "japanese") { "data\japanese_cards_database.csv" } else { "data\all_cards_database.csv" }
        $totalCards = 0
        try {
            $totalCards = (Get-Content $dbFile | Measure-Object -Line).Lines - 1
        } catch {
            $totalCards = "Unknown"
        }
        Write-Host ""
        $typeLabel = if ($Type -eq "japanese") { "Japanese" } else { "English" }
        Write-Host "✓ SUCCESS! $typeLabel database updated with $totalCards cards" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ UPDATE FAILED - Check error messages above" -ForegroundColor Red
    }
}

# Main execution
if ($Mode -eq "menu") {
    # Interactive menu mode
    do {
        Show-Menu
        $choice = Read-Host "Choose option"
        
        switch ($choice) {
            "1" {
                Start-Update -Type "english" -UpdateMode "auto"
                break
            }
            "2" {
                Write-Host ""
                Write-Host "WARNING: Full English download takes 3-4 hours!" -ForegroundColor Red
                $confirm = Read-Host "Are you sure? (y/n)"
                if ($confirm -eq "y") {
                    Start-Update -Type "english" -UpdateMode "full"
                } else {
                    Write-Host "Cancelled." -ForegroundColor Yellow
                }
                break
            }
            "3" {
                if (-not (Test-DatabaseExists -Type "english")) {
                    Write-Host ""
                    Write-Host "ERROR: No existing English database found!" -ForegroundColor Red
                    Write-Host "Run with Mode=full for initial download" -ForegroundColor Yellow
                } else {
                    Start-Update -Type "english" -UpdateMode "incremental"
                }
                break
            }
            "4" {
                Start-Update -Type "japanese"
                break
            }
            "q" {
                exit
            }
            default {
                Write-Host "Invalid choice!" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Read-Host "Press Enter to continue"
        Clear-Host
    } while ($true)
}
