# seed_test_data.ps1
# Run this to populate the SIEM with realistic test events
# Usage: .\scripts\seed_test_data.ps1

$API = "http://localhost:8000/api/logs/ingest"
$headers = @{ "Content-Type" = "application/json" }

function Send-Log($body) {
    $json = $body | ConvertTo-Json
    Invoke-RestMethod -Uri $API -Method POST -Headers $headers -Body $json | Out-Null
}

Write-Host "Seeding SIEM with test data..." -ForegroundColor Cyan

# ── Brute Force Attack (6 failed logins from same IP) ─────────────────────
Write-Host "  -> Simulating brute force attack..." -ForegroundColor Yellow
for ($i = 1; $i -le 6; $i++) {
    Send-Log @{
        source_ip   = "185.220.101.45"
        event_type  = "failed_login"
        severity    = "medium"
        hostname    = "auth-server-01"
        username    = "administrator"
        log_source  = "windows"
        raw_message = "Failed password for administrator from 185.220.101.45 port 22 ssh2"
    }
    Start-Sleep -Milliseconds 200
}

# ── Port Scan (12 different ports) ────────────────────────────────────────
Write-Host "  -> Simulating port scan..." -ForegroundColor Yellow
$ports = @(21, 22, 23, 25, 53, 80, 443, 445, 1433, 3306, 3389, 8080)
foreach ($port in $ports) {
    Send-Log @{
        source_ip        = "10.0.0.88"
        destination_port = $port
        event_type       = "firewall_drop"
        severity         = "low"
        hostname         = "fw-edge-01"
        log_source       = "firewall"
        raw_message      = "BLOCKED connection attempt to port $port"
    }
    Start-Sleep -Milliseconds 100
}

# ── Privilege Escalation ──────────────────────────────────────────────────
Write-Host "  -> Simulating privilege escalation..." -ForegroundColor Yellow
Send-Log @{
    source_ip   = "192.168.1.55"
    event_type  = "privilege_event"
    severity    = "high"
    hostname    = "dev-workstation-07"
    username    = "jsmith"
    log_source  = "linux"
    raw_message = "sudo su root executed by user jsmith - command: /bin/bash"
}

# ── Normal login activity ─────────────────────────────────────────────────
Write-Host "  -> Adding normal login activity..." -ForegroundColor Green
$normal_users = @("alice", "bob", "carol", "dave")
foreach ($user in $normal_users) {
    Send-Log @{
        source_ip   = "192.168.1.$(Get-Random -Min 10 -Max 50)"
        event_type  = "successful_login"
        severity    = "low"
        hostname    = "corp-dc-01"
        username    = $user
        log_source  = "windows"
        raw_message = "User $user logged on successfully"
    }
}

# ── Web server 404 floods ─────────────────────────────────────────────────
Write-Host "  -> Adding web traffic..." -ForegroundColor Green
for ($i = 1; $i -le 5; $i++) {
    Send-Log @{
        source_ip        = "203.0.113.$i"
        destination_port = 80
        event_type       = "http_request"
        severity         = "low"
        hostname         = "web-01"
        log_source       = "web"
        raw_message      = "GET /wp-admin/login.php HTTP/1.1 404"
    }
}

Write-Host ""
Write-Host "Done! Check your SIEM dashboard at http://localhost:5173" -ForegroundColor Cyan
Write-Host "You should see brute force + port scan alerts generated." -ForegroundColor Cyan
