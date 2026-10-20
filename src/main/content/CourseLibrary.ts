import { CourseFileSchema, type CourseFile } from '@shared/schemas/course'

/**
 * Các khoá học tự soạn (content/curated/courses/*.json), đóng gói sẵn trong app. File sai schema bị bỏ qua kèm cảnh báo;
 * test nội dung kiểm tra mọi bước đều trỏ tới bài có thật.
 */
export class CourseLibrary {
  private readonly list: CourseFile[]

  constructor(files: unknown[], warn: (message: string) => void = console.warn) {
    const parsed: CourseFile[] = []
    for (const file of files) {
      const result = CourseFileSchema.safeParse(file)
      if (result.success) parsed.push(result.data)
      else warn(`[courses] bỏ qua file sai schema: ${result.error.issues[0]?.message}`)
    }
    this.list = parsed.sort((a, b) => a.course.order - b.course.order)
  }

  courses(): CourseFile[] {
    return this.list
  }

  course(id: string): CourseFile | undefined {
    return this.list.find((c) => c.course.id === id)
  }
}
