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
  | 'pet'
  | 'shop'
  | 'stats'
  | 'placement'
  | 'toeic'
  | 'videos'
  | 'settings'

export type Place =
  | 'school'
  | 'library'
  | 'hall'
  | 'well'
  | 'tower'
  | 'pier'
  | 'market'
  | 'home'
  | 'office'

export const PLACE_PAGES: Record<Place, StudyPage[]> = {
  school: ['courses', 'lessons', 'reading', 'listening', 'grammar', 'placement', 'toeic', 'videos'],
  library: ['words'],
  hall: ['practice'],
  well: ['review'],
  tower: ['stats'],
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

export function placeOf(page: StudyPage): Place {
  const hit = (Object.keys(PLACE_PAGES) as Place[]).find((p) => PLACE_PAGES[p].includes(page))
  return hit ?? 'school'
}

/** Trang con báo cho PlaceShell ẩn tab khi đang học một bài (docs/23 S1Lesson) */
export const SHELL_FOCUS: InjectionKey<Ref<boolean>> = Symbol('place-shell-focus')
