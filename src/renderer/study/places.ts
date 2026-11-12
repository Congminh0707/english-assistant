import type { InjectionKey, Ref } from 'vue'

// Điều hướng v2: mỗi địa điểm trong làng gom một nhóm trang (docs/23 §1).
export type StudyPage =
  | 'home'
  | 'parent'
  | 'courses'
  | 'lessons'
  | 'reading'
  | 'listening'
  | 'grammar'
  | 'phrasebook'
  | 'review'
  | 'practice'
  | 'words'
  | 'diary'
  | 'writing'
  | 'pet'
  | 'shop'
  | 'stats'
  | 'placement'
  | 'toeic'
  | 'videos'
  | 'settings'

export type Place =
  'school' | 'library' | 'hall' | 'well' | 'tower' | 'pier' | 'market' | 'home' | 'office'

/** Nhóm tab trong một địa điểm: hàng tab chính là nhóm, nhóm nhiều trang có thêm hàng tab con */
export interface PageGroup {
  /** Khoá i18n `study.navGroup.<id>` */
  id: string
  pages: StudyPage[]
}

/** Địa điểm có nhóm tab; địa điểm không có ở đây giữ tab phẳng theo PLACE_PAGES */
export const PLACE_GROUPS: Partial<Record<Place, PageGroup[]>> = {
  school: [
    { id: 'path', pages: ['courses'] },
    { id: 'bank', pages: ['lessons', 'grammar', 'reading', 'listening', 'videos'] },
    { id: 'exam', pages: ['toeic'] }
  ]
}

const groupPages = (place: Place): StudyPage[] =>
  (PLACE_GROUPS[place] ?? []).flatMap((g) => g.pages)

export const PLACE_PAGES: Record<Place, StudyPage[]> = {
  // Trang đầu tiên là trang mở khi bấm địa điểm trên bản đồ
  school: groupPages('school'),
  library: ['words', 'diary'],
  hall: ['practice', 'writing'],
  well: ['review'],
  tower: ['stats', 'placement'],
  pier: ['phrasebook'],
  market: ['shop'],
  home: ['pet'],
  office: ['settings', 'parent']
}

/** Tên tranh trong shared/art/scenes: place-<tên>.art.html */
export const PLACE_SCENE: Record<Place, string> = {
  school: 'courses',
  library: 'words',
  hall: 'practice',
  well: 'review',
  tower: 'stats',
  pier: 'phrases',
  market: 'shop',
  home: 'pet',
  office: 'settings'
}

/** Trang có thật (để kiểm tra trang main yêu cầu mở qua study:open-page) */
export function isStudyPage(value: string): value is StudyPage {
  return (
    value === 'home' ||
    Object.values(PLACE_PAGES).some((pages) => pages.includes(value as StudyPage))
  )
}

export function placeOf(page: StudyPage): Place {
  const hit = (Object.keys(PLACE_PAGES) as Place[]).find((p) => PLACE_PAGES[p].includes(page))
  return hit ?? 'school'
}

/** Trang con báo cho PlaceShell ẩn tab khi đang học một bài (docs/23 S1Lesson) */
export const SHELL_FOCUS: InjectionKey<Ref<boolean>> = Symbol('place-shell-focus')
