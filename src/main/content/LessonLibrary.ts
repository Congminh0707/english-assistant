import { LessonUnitFileSchema, type Lesson, type LessonUnitFile } from '@shared/schemas/lesson'

export interface LibraryUnit {
  id: string
  title: string
  summary: string
  icon: string
  order: number
  lessons: Lesson[]
}

/**
 * Thư viện bài học nền tảng đã nạp từ content/curated/lessons/*.json (tự soạn, bundle sẵn trong app).
 * File sai schema bị bỏ qua kèm cảnh báo — một chương lỗi không làm hỏng cả app (test nội dung sẽ bắt lỗi từ trước).
 */
export class LessonLibrary {
  private readonly unitList: LibraryUnit[]
  private readonly byId = new Map<string, Lesson>()
  private readonly order: string[] = []

  constructor(files: unknown[], warn: (message: string) => void = console.warn) {
    const parsed: LessonUnitFile[] = []
    for (const file of files) {
      const result = LessonUnitFileSchema.safeParse(file)
      if (result.success) parsed.push(result.data)
      else warn(`[lessons] bỏ qua file nội dung sai schema: ${result.error.issues[0]?.message}`)
    }
    this.unitList = parsed
      .map((f) => ({ ...f.unit, lessons: f.lessons }))
      .sort((a, b) => a.order - b.order)
    for (const unit of this.unitList) {
      for (const lesson of unit.lessons) {
        this.byId.set(lesson.id, lesson)
        this.order.push(lesson.id)
      }
    }
  }

  units(): LibraryUnit[] {
    return this.unitList
  }

  lesson(id: string): Lesson | undefined {
    return this.byId.get(id)
  }

  get lessonCount(): number {
    return this.order.length
  }

  /** Bài kế tiếp trong lộ trình (qua chương); null nếu là bài cuối hoặc id lạ */
  nextLessonId(id: string): string | null {
    const i = this.order.indexOf(id)
    return i >= 0 && i + 1 < this.order.length ? this.order[i + 1] : null
  }
}
