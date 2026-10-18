# Thuật ngữ (Glossary)

Giải thích cho người quen Laravel/Vue, chưa làm app desktop.

## Desktop / Electron

| Thuật ngữ | Giải thích | Tương đương web/Laravel |
|---|---|---|
| **Electron** | Framework làm app desktop bằng HTML/CSS/JS: gói Chromium (hiển thị) + Node.js (hệ thống) | Trình duyệt + server Node gộp lại |
| **Main process** | Tiến trình Node.js chính, duy nhất. Quản lý cửa sổ, hệ thống, DB | Laravel backend |
| **Renderer process** | Mỗi cửa sổ là một trang web riêng, chạy Vue | Frontend Vue trên trình duyệt |
| **Preload script** | Script chạy trước trang, cung cấp `window.api` an toàn | API client đã cấu hình |
| **IPC** | Gửi tin giữa renderer và main | HTTP request nội bộ |
| `ipcMain.handle` / `ipcRenderer.invoke` | Request–response | Route + controller / `axios.post` |
| `webContents.send` | Main đẩy sự kiện xuống cửa sổ | Broadcasting (Echo) |
| **contextBridge** | Cơ chế expose API từ preload sang trang một cách an toàn | — |
| **contextIsolation / sandbox** | Cách ly trang web khỏi quyền hệ thống | — |
| **BrowserWindow** | Một cửa sổ ứng dụng | Một tab trình duyệt |
| **Frameless window** | Cửa sổ không có thanh tiêu đề/viền của Windows | — |
| **Transparent window** | Cửa sổ có nền trong suốt, chỉ thấy nội dung vẽ | — |
| **Click-through** | Chuột đi xuyên qua cửa sổ xuống app bên dưới (`setIgnoreMouseEvents`) | `pointer-events: none` nhưng ở mức hệ điều hành |
| **Always on top** | Cửa sổ luôn nổi trên cùng | `z-index` cao nhất toàn hệ thống |
| **Tray** | Icon ở khay hệ thống (góc phải taskbar, cạnh đồng hồ) | — |
| **Global shortcut** | Phím tắt hoạt động cả khi app không được focus | — |
| **Work area** | Vùng màn hình trừ taskbar | — |
| **DIP / DPI scaling** | Điểm ảnh độc lập thiết bị; Windows scale 125%/150% | CSS px vs device px |
| **utilityProcess** | Tiến trình Node phụ để chạy việc nặng (AI) không làm đứng app | Queue worker |
| **Native module** | Package npm có code C/C++ cần biên dịch (vd `better-sqlite3`) | PHP extension |
| **electron-rebuild** | Biên dịch lại native module cho đúng phiên bản Electron | `pecl install` lại |
| **asar** | File nén chứa code app khi đóng gói | `vendor` + code đã build |
| **NSIS** | Công cụ tạo installer `.exe` cho Windows | — |
| **userData** | Thư mục dữ liệu của app trên máy người dùng (`%APPDATA%\english-assistant`) | `storage/` |
| **Code signing** | Ký số file cài đặt để Windows tin tưởng | Chứng chỉ SSL (ý tưởng tương tự) |
| **Auto-update** | App tự tải bản mới | Deploy |
| **Hot reload (HMR)** | Sửa code thấy ngay không cần khởi động lại | Vite HMR |

## Đồ hoạ

| Thuật ngữ | Giải thích |
|---|---|
| **Sprite** | Hình nhân vật/vật thể 2D |
| **Sprite sheet** | Một ảnh chứa nhiều frame xếp lưới |
| **Frame** | Một hình trong chuỗi animation |
| **FPS** | Số frame mỗi giây |
| **Pixel art** | Phong cách vẽ từng điểm ảnh, độ phân giải thấp |
| **Chibi** | Phong cách nhân vật đầu to, thân nhỏ, dễ thương |
| **Anchor** | Điểm gốc của sprite (thường là chân) để đặt vị trí |
| **State machine** | Mô hình "trạng thái + chuyển trạng thái" điều khiển hành vi |
| `image-rendering: pixelated` | CSS giữ pixel sắc nét khi phóng to |

## Học tập

| Thuật ngữ | Giải thích |
|---|---|
| **CEFR** | Khung tham chiếu ngôn ngữ châu Âu: A1, A2, B1, B2, C1, C2 (+ Pre-A1) |
| **Cambridge YLE** | Kỳ thi trẻ em: Starters (Pre-A1), Movers (A1), Flyers (A2) |
| **TOEIC L&R** | Bài thi tiếng Anh công sở, 10–990 điểm, Listening & Reading |
| **IELTS** | Bài thi học thuật/định cư, band 0–9, 4 kỹ năng |
| **VSTEP** | Khung năng lực ngoại ngữ 6 bậc của Việt Nam |
| **SRS** | Spaced Repetition System — lặp lại ngắt quãng |
| **FSRS** | Free Spaced Repetition Scheduler — thuật toán SRS hiện đại, mã nguồn mở |
| **Elo rating** | Hệ thống điểm (từ cờ vua) dùng ước lượng năng lực người học & độ khó câu hỏi |
| **Placement test** | Bài kiểm tra xếp lớp đầu vào |
| **Adaptive test (CAT)** | Bài test chọn câu tiếp theo dựa trên câu trả lời trước |
| **Graded reader** | Sách/truyện viết theo cấp độ |
| **Dictation** | Nghe chép chính tả |
| **Shadowing** | Nghe và nói theo gần như đồng thời |
| **Minimal pairs** | Cặp từ chỉ khác 1 âm (ship/sheep) |
| **Phonics** | Phương pháp dạy đọc qua liên kết âm – chữ |
| **Sight words** | Từ thông dụng cần nhận diện ngay (các danh sách nổi tiếng: Dolch, Fry) |
| **IPA** | Bảng phiên âm quốc tế |
| **Lemma** | Dạng gốc của từ (`went` → `go`) |
| **WER** | Word Error Rate — tỉ lệ lỗi theo từ khi so transcript |
| **Band descriptors** | Mô tả tiêu chí chấm từng band IELTS |

## AI

| Thuật ngữ | Giải thích |
|---|---|
| **LLM** | Mô hình ngôn ngữ lớn (Claude, GPT, Gemini, Llama...) |
| **BYOK** | Bring Your Own Key — người dùng tự nhập API key của mình |
| **TTS** | Text-to-Speech — chuyển chữ thành giọng nói |
| **STT / ASR** | Speech-to-Text — nhận dạng giọng nói |
| **OCR** | Nhận dạng chữ trong ảnh |
| **Whisper** | Model nhận dạng giọng nói mã nguồn mở |
| **ONNX** | Định dạng model AI chạy được trên nhiều nền tảng |
| **transformers.js** | Thư viện chạy model AI bằng JavaScript (WASM/WebGPU) |
| **Quantization** | Lượng tử hoá — nén model cho nhẹ & nhanh hơn |
| **Ollama** | Công cụ chạy LLM local trên máy |

## Giấy phép

| Thuật ngữ | Giải thích |
|---|---|
| **Public domain (PD)** | Không còn/không có bản quyền — dùng tự do |
| **CC0** | Từ bỏ mọi quyền — dùng tự do, không cần ghi công |
| **CC BY** | Dùng tự do (kể cả thương mại), **phải ghi công** |
| **CC BY-SA** | Như CC BY + **tác phẩm phái sinh phải dùng cùng license** |
| **CC BY-NC** | Không được dùng thương mại |
| **CC BY-ND** | Không được chỉnh sửa (tạo phái sinh) |
| **MIT / Apache 2.0 / BSD** | License phần mềm dễ dãi, chỉ cần giữ thông báo bản quyền |
| **GPL / LGPL** | License "copyleft": GPL yêu cầu phần mềm dùng nó cũng mở mã; LGPL lỏng hơn (cho phép liên kết) |
| **OFL** | SIL Open Font License — font dùng tự do, nhúng vào app được |
| **Embed-only** | Chỉ được nhúng qua trình phát chính thức, không tải về/phân phối lại |
