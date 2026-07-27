# Khao sat ket noi BE <-> Database (RHS).
# Chay tren may dang chay BE (dang le ra la may cua anh).

$ErrorActionPreference = 'Continue'
$Result = [ordered]@{}

Write-Output '=== 1) Be dang chay khong? (port 7085) ==='
try {
    $tcp = [System.Net.Sockets.TcpClient]::new()
    $iar = $tcp.BeginConnect('127.0.0.1', 7085, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(2000) -and $tcp.Connected
    if ($ok) {
        Write-Output 'Port 7085 OPEN (BE dang lang nghe).'
        $tcp.EndConnect($iar); $tcp.Close()
    } else {
        Write-Output 'Port 7085 KHONG mo -> BE chua chay hoac dung port khac.'
    }
} catch { Write-Output ("Port check loi: " + $_.Exception.Message) }

Write-Output ''
Write-Output '=== 2) Process dotnet dang chay ==='
$procs = Get-Process -Name dotnet -ErrorAction SilentlyContinue | Select-Object Id, StartTime, @{n='CmdLine';e={(Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -EA SilentlyContinue).CommandLine}}
$procs | Format-Table -AutoSize -Wrap | Out-String | Write-Output

Write-Output ''
Write-Output '=== 3) IIS Express? ==='
$iis = Get-Process -Name 'iisexpress' -ErrorAction SilentlyContinue
if ($iis) { $iis | Select-Object Id, StartTime | Format-Table -AutoSize | Out-String | Write-Output } else { Write-Output 'Khong co iisexpress' }

Write-Output ''
Write-Output '=== 4) SQL Server Browser + instance ==='
Get-Service -Name 'MSSQLSERVER','MSSQL$SQLEXPRESS','SQLBrowser' -ErrorAction SilentlyContinue |
    Select-Object Name, Status, StartType | Format-Table -AutoSize | Out-String | Write-Output

Write-Output ''
Write-Output '=== 5) Co the truy cap SQL Server khong? ==='
$cn = [System.Data.SqlClient.SqlConnection]::new()
$cn.ConnectionString = 'Server=localhost\\SQLEXPRESS;Database=master;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=3'
try { $cn.Open(); Write-Output ('SQL OK -> ' + $cn.ServerVersion) } catch { Write-Output ('SQL FAIL: ' + $_.Exception.Message) }
finally { if ($cn.State -eq 'Open') { $cn.Close() } }

Write-Output ''
Write-Output '=== 6) Co the mo database RHS_Database khong? ==='
$cn = [System.Data.SqlClient.SqlConnection]::new()
$cn.ConnectionString = 'Server=localhost\\SQLEXPRESS;Database=RHS_Database;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=3'
try { $cn.Open(); Write-Output 'RHS_Database: OK' } catch { Write-Output ('RHS_Database FAIL: ' + $_.Exception.Message) }
finally { if ($cn.State -eq 'Open') { $cn.Close() } }

Write-Output ''
Write-Output '=== 7) Ten server cua BE trong appsettings ==='
$root = 'C:\Users\Admin\Downloads\FEfull'
$cands = Get-ChildItem -Path $root -Recurse -Filter appsettings*.json -ErrorAction SilentlyContinue
foreach ($f in $cands) {
    Write-Output ('-- ' + $f.FullName)
    try {
        $j = Get-Content $f.FullName -Raw | ConvertFrom-Json
        foreach ($k in @('ConnectionStrings','AllowedHosts')) {
            if ($j.PSObject.Properties.Name -contains $k) {
                $v = $j.$k | ConvertTo-Json -Depth 4
                Write-Output "$k = $v"
            }
        }
    } catch { Write-Output ('parse FAIL: ' + $_.Exception.Message) }
}