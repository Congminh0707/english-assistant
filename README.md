# English Assistant

Desktop Mascot (chibi/pixel) cho Windows — nuôi thú cưng, dịch nhanh và học tiếng Anh ngay trong lúc dùng máy tính, từ mầm non tới TOEIC 990 / IELTS 9.0.

- Tài liệu hệ thống: [docs/README.md](docs/README.md)
- Hướng dẫn cho AI agent: [AGENTS.md](AGENTS.md)
- Cài môi trường & chạy lần đầu: [docs/04-getting-started.md](docs/04-getting-started.md)

## Lệnh

```bash
pnpm install
pnpm dev                  # chạy app (hot reload)
pnpm lint
pnpm typecheck
pnpm sprites:characters  # sinh lại sprite cho mọi thú cưng (≈ 80 giây; thêm tên nhân vật/giai đoạn để chạy riêng)
pnpm build:win            # build installer NSIS vào dist/
```

Thoát app: chuột phải icon ở khay hệ thống → **Thoát**.

## Giấy phép

Mã nguồn phát hành theo giấy phép [MIT](LICENSE). Nội dung bài học lấy từ nguồn bên ngoài giữ nguyên giấy phép gốc của từng nguồn — xem [docs/08-content-sources.md](docs/08-content-sources.md).
