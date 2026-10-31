# kw3d — chụp cảnh 3D thật của Kids World để làm bảng thiết kế

- `map3dx.ts` = bản vá của `src/renderer/study/kids/game/map3d.ts` (chỉ để thiết kế, KHÔNG dùng trong app): thêm `opts.hooks.ready/frame`, uniform `tintMul/tintAdd/snowAmt` ở hậu kỳ, nới giới hạn camera (dist 1,6–520, pitch ≥ 0,12). Đường dẫn import là tuyệt đối (D:/Gonbi/...), sửa lại khi chạy ở máy khác.
- `scene.ts` = harness: URL query `at, dist, pitch, yaw, sky(dawn|noon|dusk|night|rain|nightrain|snow|fog), prov, lbl, pins, veh, pet…`.
- Build: `esbuild src/scene.ts --bundle --format=esm --outfile=scene.js --alias:@shared=<repo>/src/shared --external:three`; `scene.html` import map `three → three.module.js` (copy từ node_modules/three/build).
- Chụp: `shot.ps1` (Edge headless, SwiftShader, tự thử lại khi ảnh trống). `compose.py` ghép ảnh + HUD thành các bảng `.dc.html`.
- Cần `vn_merged.json` (từ `../vn-provinces-merge.py`), không commit dữ liệu thô.
