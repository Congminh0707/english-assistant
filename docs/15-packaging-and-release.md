# 15 — Đóng gói & phát hành

## 1. Build installer cho Windows

Dùng **electron-builder** với target **NSIS** (installer `.exe` quen thuộc).

`electron-builder.yml` (tối thiểu):

```yaml
appId: net.gonbi.englishassistant      # đổi theo domain thật
productName: English Assistant
directories:
  buildResources: resources
  output: dist
files:                                   # danh sách CHO PHÉP — đừng đổi sang kiểu loại trừ:
  - out/**/*                             # code đã build bởi electron-vite (node_modules production tự thêm)
  - '!**/*.map'                          # kiểu loại trừ từng cuốn cả .claude/worktrees vào app → installer ~1 GB
asarUnpack:
  - '**/node_modules/better-sqlite3/**'  # native module phải nằm ngoài asar
extraResources:
  - from: src/main/db/migrations         # migration của user.db
    to: migrations
  - from: content/packs                  # .eapack do pipeline build (pnpm content:build) — phải có trước khi build installer
    to: packs
    filter: ['*.eapack']
win:
  target:
    - target: nsis
      arch: [x64]
  icon: resources/icon.ico
nsis:
  oneClick: false
  perMachine: false                      # cài cho user hiện tại, không cần quyền admin
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  shortcutName: English Assistant
publish:
  provider: github                       # dùng GitHub Releases cho auto-update
  owner: <github-user>
  repo: english-assistant
```

Lệnh:
```powershell
pnpm build:win
```
Kết quả trong `dist/`: `English Assistant Setup x.y.z.exe`, `latest.yml` (cho auto-update), `.blockmap`.

> Content pack lớn (TOEIC, IELTS, B2+) **không** đưa vào installer — tải trong app để installer gọn (< 150 MB).

## 2. Đường dẫn khi chạy

| Thứ | Dev | Production |
|---|---|---|
| Code | `src/` qua Vite | `resources/app.asar` |
| Pack đi kèm | `content/packs/bundled` | `process.resourcesPath + '/packs'` → copy sang `userData/packs` lần đầu |
| Dữ liệu người dùng | `app.getPath('userData')` | `%APPDATA%\english-assistant\` |
| Model AI | `userData/models` | như dev |
| Log | `userData/logs` | như dev |

Luôn dùng helper `paths.ts` thay vì viết cứng đường dẫn.

## 3. Phiên bản & changelog

- Semantic Versioning: `MAJOR.MINOR.PATCH` (`0.x` trong giai đoạn trước phát hành rộng).
- Version nằm trong `package.json`. Ghi `CHANGELOG.md` (tiếng Việt) mỗi lần phát hành.
- Content pack có version riêng, độc lập với app; `schemaVersion` của pack phải tương thích với app (app khai báo `SUPPORTED_PACK_SCHEMA = [1]`).

## 4. Auto-update

> ✅ **Đã làm** (`src/main/system/UpdateManager.ts`): kiểm tra GitHub Releases sau 45 giây khi mở app và mỗi 6 giờ (cài đặt `app.autoUpdate`, mặc định bật; chỉ bản đã đóng gói). Không tự tải hay tự cài: Cài đặt → Cập nhật hiện "có bản mới (~x MB)" → người dùng bấm tải → "Khởi động lại để cài". Phát hành: `GH_TOKEN=<token> pnpm release:win` (electron-builder đẩy installer + `latest.yml` + `.blockmap` lên GitHub Release của tag trùng version trong `package.json`). Kênh `beta` và thông báo qua mascot để sau.

- `electron-updater` kiểm tra GitHub Releases khi khởi động + mỗi 6 giờ.
- Tải nền, hỏi người dùng "Cập nhật khi thoát app?" — mascot báo bằng bong bóng thay vì dialog hệ thống.
- Kênh: `latest` (ổn định) và `beta` (tuỳ chọn trong Cài đặt).
- Migration DB chạy tự động sau cập nhật; **`user.db` được sao lưu trước khi migrate** (✅ `backupBeforeMigrate` trong `src/main/db/client.ts`: chỉ khi còn migration chưa áp dụng, lưu `user.db.bak-<yyyymmddhhmmss>` cạnh file gốc, giữ 3 bản gần nhất).

## 5. Code signing

- Chưa ký số → Windows SmartScreen hiện cảnh báo "Windows protected your PC". Chấp nhận được khi thử nghiệm nội bộ.
- Phát hành rộng: mua chứng chỉ code signing (OV/EV) hoặc dùng dịch vụ ký trên cloud (ví dụ Azure Trusted Signing) và cấu hình trong electron-builder. Ghi quyết định vào [decisions.md](decisions.md).

## 6. CI (GitHub Actions — khi có repo)

Workflow `release.yml` chạy trên `windows-latest` khi push tag `v*`:
1. Checkout, setup Node + pnpm, `pnpm install` (cache).
2. `pnpm lint && pnpm test`.
3. `pnpm content:validate` (nếu pack thay đổi).
4. `pnpm build:win` với `GH_TOKEN` → tự đăng bản nháp lên GitHub Releases.
5. Kiểm tra thủ công bản nháp rồi Publish.

## 7. Checklist trước mỗi bản phát hành

- [ ] Cài mới trên Windows 10 và 11 sạch (máy ảo).
- [ ] Nâng cấp từ bản trước: dữ liệu người dùng còn nguyên, migration chạy OK.
- [ ] Mascot: checklist ở [05](05-mascot-system.md#9-kiểm-thử-thủ-công-cho-mascot-checklist).
- [ ] Dịch offline hoạt động khi ngắt mạng.
- [ ] Gỡ cài đặt sạch (hỏi có xoá dữ liệu người dùng không).
- [ ] Màn hình "Giấy phép & ghi công" hiển thị đủ nguồn của các pack.
- [ ] CHANGELOG cập nhật.
