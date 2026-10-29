// Nội dung bài học tự soạn, đóng gói thẳng vào app (Vite gom các file JSON lúc build; vitest cũng đọc được).
const modules = import.meta.glob('../../../content/curated/lessons/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>

export const bundledLessonFiles: unknown[] = Object.entries(modules)
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([, file]) => file)

// Ngữ pháp và bài đọc tự soạn: cùng cách đóng gói (thư mục chưa có file thì danh sách rỗng)
const load = (modules: Record<string, unknown>): unknown[] =>
  Object.entries(modules)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, file]) => file)

export const bundledGrammarFiles: unknown[] = load(
  import.meta.glob('../../../content/curated/grammar/*.json', { eager: true, import: 'default' })
)
export const bundledReadingFiles: unknown[] = load(
  import.meta.glob('../../../content/curated/readings/*.json', { eager: true, import: 'default' })
)
export const bundledPhrasebookFiles: unknown[] = load(
  import.meta.glob('../../../content/curated/phrasebook/*.json', { eager: true, import: 'default' })
)
export const bundledPlacementFiles: unknown[] = load(
  import.meta.glob('../../../content/curated/placement/*.json', { eager: true, import: 'default' })
)
export const bundledKidsFiles: unknown[] = load(
  import.meta.glob('../../../content/curated/kids/*.json', { eager: true, import: 'default' })
)
// Bản đồ thế giới của bé (docs/19): world.json + một file mỗi nơi
export const bundledKidsWorldFiles: unknown[] = load(
  import.meta.glob('../../../content/curated/kids/world/world.json', {
    eager: true,
    import: 'default'
  })
)
export const bundledKidsPlaceFiles: unknown[] = load(
  import.meta.glob('../../../content/curated/kids/world/places/*.json', {
    eager: true,
    import: 'default'
  })
)
export const bundledListeningFiles: unknown[] = load(
  import.meta.glob('../../../content/curated/listening/*.json', { eager: true, import: 'default' })
)
export const bundledCourseFiles: unknown[] = load(
  import.meta.glob('../../../content/curated/courses/*.json', { eager: true, import: 'default' })
)
