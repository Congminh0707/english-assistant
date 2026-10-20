// Lộ trình học (Course → Unit → Lesson): một khoá là chuỗi các bước, mỗi bước trỏ tới một bài có sẵn (bài học nền tảng,
// ngữ pháp, bài đọc, bài nghe) — file nội dung tự soạn: content/curated/courses/<số>-<tên>.json
import { z } from 'zod'
import { LevelCode } from './content/level'
import { LessonKindSchema } from './lesson'

const Text = z.string().trim().min(1)

export const CourseStepSchema = z.object({
  kind: LessonKindSchema,
  /** Id bài, vd 'alphabet.letters' */
  id: z.string().regex(/^[a-z0-9]+\.[a-z0-9-]+$/)
})

export const CourseFileSchema = z.object({
  license: z.literal('proprietary-own'),
  course: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: Text,
    summary: Text,
    icon: Text,
    levelFrom: LevelCode,
    levelTo: LevelCode,
    order: z.number().int().min(1)
  }),
  units: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        title: Text,
        summary: Text,
        steps: z.array(CourseStepSchema).min(2).max(30)
      })
    )
    .min(2)
})
export type CourseFile = z.infer<typeof CourseFileSchema>

// --- Dữ liệu cho giao diện ---

export const CourseStepStateSchema = CourseStepSchema.extend({
  title: z.string(),
  minutes: z.number().int(),
  level: LevelCode,
  done: z.boolean(),
  /** Điểm cao nhất (0–100) hoặc null nếu chưa làm */
  best: z.number().int().nullable()
})
export type CourseStepState = z.infer<typeof CourseStepStateSchema>

export const CourseSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  icon: z.string(),
  levelFrom: LevelCode,
  levelTo: LevelCode,
  stepsDone: z.number().int(),
  stepsTotal: z.number().int(),
  /** Bước kế tiếp chưa làm (null nếu đã xong cả khoá) */
  next: CourseStepStateSchema.nullable()
})
export type CourseSummary = z.infer<typeof CourseSummarySchema>

export const CourseDetailSchema = CourseSummarySchema.extend({
  units: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      steps: z.array(CourseStepStateSchema)
    })
  )
})
export type CourseDetail = z.infer<typeof CourseDetailSchema>

export const CourseListSchema = z.object({ courses: z.array(CourseSummarySchema) })
