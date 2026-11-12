import type { LessonKind } from '@shared/schemas/lesson'
import type { DailyPlan, DailyPlanItem } from '@shared/schemas/study'
import type { UiIconName } from '@renderer/shared/components/UiIcon.vue'
import { placeOf, type Place, type StudyPage } from './places'

// Hiển thị và điều hướng một mục của lộ trình hôm nay (docs/07 §13), dùng chung cho thẻ "Hôm nay" trên
// bản đồ làng và ngăn kéo TodayDrawer. Loại mục so bằng chuỗi để main thêm loại mới (vd 'toeic') không làm
// vỡ kiểu ở đây; loại lạ thì hiện tên main gửi và mở trang Lộ trình.

type Translate = (key: string, named?: Record<string, unknown>) => string

// UiIcon chưa có book/target/dumbbell → dùng icon gần nhất có sẵn
const KIND_ICON: Record<string, UiIconName> = {
  review: 'cards',
  lesson: 'write',
  skill: 'star',
  practice: 'repeat',
  toeic: 'test'
}

export function planItemIcon(item: DailyPlanItem): UiIconName {
  return KIND_ICON[item.kind as string] ?? 'star'
}

export function planItemTitle(item: DailyPlanItem, t: Translate): string {
  const kind: string = item.kind
  if (kind === 'review') {
    return item.count ? t('study.plan.review', { n: item.count }) : t('study.plan.reviewDone')
  }
  if (kind === 'practice') return t('study.plan.practice')
  if (kind === 'toeic') return t('study.plan.toeic')
  return item.title
}

export function planItemSubtitle(item: DailyPlanItem, t: Translate): string | undefined {
  if (item.kind === 'skill' && item.skill) {
    return t('study.plan.weakSkill', { skill: t(`study.plan.skill.${item.skill}`) })
  }
  return item.subtitle
}

const LESSON_PAGE: Record<LessonKind, StudyPage> = {
  lesson: 'lessons',
  grammar: 'grammar',
  reading: 'reading',
  listening: 'listening'
}

/** Trang mở cho một mục + bài mở thẳng (nếu có); loại lạ/thiếu id bài → trang Lộ trình */
export function planItemTarget(item: DailyPlanItem): {
  page: StudyPage
  start: { kind: LessonKind; id: string } | null
} {
  const kind: string = item.kind
  if (kind === 'review') return { page: 'review', start: null }
  if (kind === 'practice') return { page: 'practice', start: null }
  if (kind === 'toeic') return { page: 'toeic', start: null }
  if (item.lessonKind && item.lessonId) {
    return {
      page: LESSON_PAGE[item.lessonKind],
      start: { kind: item.lessonKind, id: item.lessonId }
    }
  }
  return { page: 'courses', start: null }
}

/** Địa điểm trên bản đồ chứa mục này (ôn → giếng, luyện tập → đình, bài học/TOEIC → trường) */
export function planItemPlace(item: DailyPlanItem): Place {
  return placeOf(planItemTarget(item).page)
}

/** Mục kế tiếp chưa làm; null khi không có lộ trình hoặc đã xong hết */
export function nextPlanItem(plan: DailyPlan | null): DailyPlanItem | null {
  return plan?.items.find((i) => !i.done) ?? null
}
