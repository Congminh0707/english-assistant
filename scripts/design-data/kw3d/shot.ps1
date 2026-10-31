param([string]$page,[string]$out,[int]$w=1600,[int]$h=900,[int]$budget=60000,[int]$minsize=45000)
$d='C:\Users\01217\AppData\Local\Temp\kw3d'
for($try=0;$try -lt 4;$try++){
  if(Test-Path "$d\$out"){Remove-Item "$d\$out"}
  & "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --no-sandbox --allow-file-access-from-files --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist "--screenshot=$d\$out" "--window-size=$w,$h" "--virtual-time-budget=$budget" "file:///$($d.Replace('\','/'))/$page" 2>$null | Out-Null
  if((Test-Path "$d\$out") -and ((Get-Item "$d\$out").Length -gt $minsize)){ "ok $out (try $try)"; return }
}
"FAILED $out"
