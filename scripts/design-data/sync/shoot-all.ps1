# Chụp mọi bảng S* để soát chéo. Tham số: thư mục project, thư mục ảnh.
param([string]$proj,[string]$out)
New-Item -ItemType Directory -Force $out | Out-Null
$edge='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
Get-ChildItem $proj -Filter 'S*.dc.html' | ForEach-Object {
  $n=$_.BaseName
  if($n -like 'S5*'){$w=1280;$h=720}elseif($n -eq 'S0System.dc'){$w=1440;$h=1400}else{$w=1100;$h=720}
  $u='file:///'+($_.FullName -replace '\\','/')
  & $edge --headless=new --disable-gpu --no-sandbox "--screenshot=$out\$n.png" "--window-size=$w,$h" --virtual-time-budget=2500 $u 2>$null | Out-Null
}
(Get-ChildItem $out -Filter *.png | Measure-Object).Count
