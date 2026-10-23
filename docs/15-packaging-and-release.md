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

> ⚠️ **Icon khay hệ thống:** main nạp `resources/icon.png` qua `?asset` (đường dẫn `<asar>/resources/icon.png` khi đã đóng gói). File này phải nằm trong `files` của `electron-builder.yml` — từng thiếu nên icon khay bị trống ở bản cài (2026-10-20, đã sửa). Sau mỗi lần đổi cấu hình `files`, kiểm tra: `pnpm exec electron-builder --win --dir` rồi xem `dist/win-unpacked/resources/app.asar.unpacked/resources/icon.png`.

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

**Các job** (tách riêng để lỗi ở đâu chạy lại đúng chỗ đó): `version` → song song `lint` / `typecheck` / `test` / `content-pack` (tải + kiểm tra sha256) → `build` (windows, `pnpm build:win`, cần cả 4 job trên xanh) → `publish` (`gh release create v<version>` kèm `*-setup.exe`, `*.blockmap`, `latest.yml`; electron-updater đọc `latest.yml`; đánh dấu "latest", **công khai ngay**).
Job lỗi: vào lần chạy trên tab Actions → **Re-run failed jobs** (chỉ chạy lại job lỗi và các job phụ thuộc; job đã xanh giữ nguyên; artifact `content-pack`/`installer` giữ 7 ngày). Nếu `publish` đã tạo release rồi mà muốn làm lại cùng version: xoá release + tag (`gh release delete v1.0.1 --cleanup-tag`) rồi push lại `release`.

**Content pack (làm một lần):** file `content/packs/core-dictionary-*.eapack` (~26 MB) bị `.gitignore` nên CI không có sẵn; workflow tải nó từ một release phụ có tag `content-pack-1.4.0` (biến `CONTENT_PACK_TAG` trong workflow) và kiểm tra sha256. Tải lên một lần từ máy có pack:

```powershell
gh release create content-pack-1.4.0 (Get-ChildItem content/packs/core-dictionary-*.eapack*) --prerelease --title "Content pack 1.4.0" --notes "Gói từ điển đi kèm bản cài (không phải bản app)"
```
Release này là `--prerelease` và tag `content-pack-*` không bị `check-version` coi là version app (chỉ tag `v*`), nên không ảnh hưởng auto-update. Khi build lại pack với version mới: tải lên release mới và đổi `CONTENT_PACK_TAG`. Repo đang công khai: pack gồm dữ liệu CC BY-SA/Wiktionary nên cần giữ ghi công trong app (docs/08).

## 6b. Gói âm thanh bài nghe (tải thêm)

Không nằm trong bộ cài. Tạo và đăng khi nội dung bài nghe đổi (hoặc lần đầu):
1. Bật "Giọng tự nhiên" trong app một lần để có model Kokoro trong `%APPDATA%/english-assistant/models`.
2. `node scripts/audio/build-listening-audio.mjs 1.0.0` (~30 phút) → `content/.build/audio/listening-audio-1.0.0.zip` + `.sha256`.
3. Đăng lên release phụ (pre-release, không ảnh hưởng auto-update): `gh release create listening-audio-1.0.0 content/.build/audio/listening-audio-1.0.0.zip content/.build/audio/listening-audio-1.0.0.zip.sha256 --prerelease --title "Listening audio 1.0.0"`.
4. Điền `size` + `sha256` thật vào `src/main/audio/packSpec.ts` (bắt buộc: app từ chối gói sai kích thước/sha256), rồi phát hành app như bình thường.
Đổi nội dung: build lại, tăng `VERSION` trong `packSpec.ts` và tag release mới.

## 6c. Gói sprite thú cưng 288px (tải thêm)

Không nằm trong bộ cài (bộ cài chỉ có sprite 96px). Tạo và đăng khi nhân vật/phụ kiện đổi:
1. `SPRITE_SCALE=3 SPRITE_OUT=content/.build/sprites-hires node scripts/sprites/make-characters.mjs` (~45 phút).
2. `node scripts/sprites/build-hires-pack.mjs 1.0.0` → `content/.build/pet-sprites-hires-1.0.0.zip` + `.sha256` (in ra size + sha256).
3. Đăng lên release phụ (pre-release, không ảnh hưởng auto-update): `gh release create pet-sprites-hires-1.0.0 content/.build/pet-sprites-hires-1.0.0.zip content/.build/pet-sprites-hires-1.0.0.zip.sha256 --prerelease --title "Pet sprites 288px 1.0.0" --notes "Gói sprite độ phân giải cao (tải thêm)"`.
4. Điền `size` + `sha256` thật vào `src/main/sprites/packSpec.ts` (app từ chối gói sai kích thước/sha256), rồi phát hành app như bình thường.
Đổi nội dung: build lại, tăng `VERSION` trong `packSpec.ts` và dùng tag release mới.

## 7. Checklist trước mỗi bản phát hành

- [ ] Cài mới trên Windows 10 và 11 sạch (máy ảo).
- [ ] Nâng cấp từ bản trước: dữ liệu người dùng còn nguyên, migration chạy OK.
- [ ] Mascot: checklist ở [05](05-mascot-system.md#9-kiểm-thử-thủ-công-cho-mascot-checklist).
- [ ] Dịch offline hoạt động khi ngắt mạng.
- [ ] Gỡ cài đặt sạch (hỏi có xoá dữ liệu người dùng không).
- [ ] Màn hình "Giấy phép & ghi công" hiển thị đủ nguồn của các pack.
- [ ] CHANGELOG cập nhật.
