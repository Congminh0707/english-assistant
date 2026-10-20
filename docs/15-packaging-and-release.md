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

## 6. CI phát hành (GitHub Actions)

> ✅ **Đã làm (2026-10-20):** `.github/workflows/release.yml` (chưa chạy thử trên GitHub). Không ký số (quyết định của chủ dự án — bàn lại khi cần).

**Chỉ chạy khi push lên nhánh `release`.** Cách phát hành một phiên bản:
1. Trên `master`: tăng `version` trong `package.json` (semver `x.y.z`), commit.
2. Đẩy sang nhánh phát hành: `git push origin master:release`. **Không push tag** — workflow tự tạo release và tag `v<version>` (trỏ đúng commit vừa push).

**Chỉ phát hành khi có version mới** (`scripts/release/check-version.mjs`, chạy thử trên máy: `node scripts/release/check-version.mjs`): so `version` trong package.json với các tag `v*` hiện có.
- Chưa có tag `v<version>` → phát hành.
- Đã có tag đó → workflow dừng ngay, thành công, không build/không đăng gì (push `release` mà không đổi version thì vô hại).
- Version thấp hơn tag cao nhất → lỗi (nhắc tăng version). Version không đúng semver → lỗi. Nếu có `CHANGELOG.md` thì phải có mục cho version mới.

**Các bước khi có version mới** (windows-latest, dừng ở bước lỗi đầu tiên, không đăng gì): `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → tải content pack → `pnpm build:win` → `gh release create v<version>` kèm `*-setup.exe`, `*.blockmap`, `latest.yml` (electron-updater đọc `latest.yml`), đánh dấu "latest", release **công khai ngay**.
Phát hành lại cùng version (do lỗi): xoá release và tag trên GitHub (`gh release delete v1.0.1 --cleanup-tag`), rồi push lại `release`.

**Content pack (làm một lần):** file `content/packs/core-dictionary-*.eapack` (~21 MB) bị `.gitignore` nên CI không có sẵn; workflow tải nó từ một release phụ có tag `content-pack-1.2.0` (biến `CONTENT_PACK_TAG` trong workflow) và kiểm tra sha256. Tải lên một lần từ máy có pack:

```powershell
gh release create content-pack-1.2.0 (Get-ChildItem content/packs/core-dictionary-*.eapack*) --prerelease --title "Content pack 1.2.0" --notes "Gói từ điển đi kèm bản cài (không phải bản app)"
```
Release này là `--prerelease` và tag `content-pack-*` không bị `check-version` coi là version app (chỉ tag `v*`), nên không ảnh hưởng auto-update. Khi build lại pack với version mới: tải lên release mới và đổi `CONTENT_PACK_TAG`. Repo đang công khai: pack gồm dữ liệu CC BY-SA/Wiktionary nên cần giữ ghi công trong app (docs/08).

## 7. Checklist trước mỗi bản phát hành

- [ ] Cài mới trên Windows 10 và 11 sạch (máy ảo).
- [ ] Nâng cấp từ bản trước: dữ liệu người dùng còn nguyên, migration chạy OK.
- [ ] Mascot: checklist ở [05](05-mascot-system.md#9-kiểm-thử-thủ-công-cho-mascot-checklist).
- [ ] Dịch offline hoạt động khi ngắt mạng.
- [ ] Gỡ cài đặt sạch (hỏi có xoá dữ liệu người dùng không).
- [ ] Màn hình "Giấy phép & ghi công" hiển thị đủ nguồn của các pack.
- [ ] CHANGELOG cập nhật.
