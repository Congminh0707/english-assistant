// Nội dung bài học tự soạn, đóng gói thẳng vào app (Vite gom các file JSON lúc build; vitest cũng đọc được).
const modules = import.meta.glob('../../../content/curated/lessons/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>

export const bundledLessonFiles: unknown[] = Object.entries(modules)
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([, file]) => file)
